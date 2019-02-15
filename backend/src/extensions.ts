import filehound from 'filehound';
import { get, isFunction } from 'lodash';
import path from 'path';
import logger from './logger';

class ExtensionManager {
    private _hasInit = false;
    private _extensions = {};

    public async init() {
        const extDir = path.resolve(__dirname, '../extensions');
        logger.debug('Extension dir:', extDir);
        const filenames = await filehound
            .create()
            .path(extDir)
            .glob('module.ts', 'module.js')
            .find();

        filenames.forEach(f => {
            const extName = path.basename(path.dirname(f));
            logger.info('Loading extension:', extName);
            this._extensions[extName] = require(f);
        });

        this._hasInit = true;
    }

    public getGraphQLConfig() {
        if (this._hasInit) {
            const keys = Object.keys(this._extensions);
            return keys
                .map(e => {
                    const ext = this._extensions[e];
                    if (ext && isFunction(get(ext, 'graphQLConfig'))) {
                        return ext.graphQLConfig();
                    }
                })
                .filter(e => !!e);
        }
    }
}

export default new ExtensionManager();
