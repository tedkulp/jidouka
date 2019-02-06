import filehound from 'filehound';
import { get, isFunction } from 'lodash';
import path from 'path';

class ExtensionManager {
    private _hasInit = false;
    private _extensions = {};

    public async init() {
        const filenames = await filehound
            .create()
            .path(path.resolve(__dirname, '../extensions'))
            .ext(['ts', 'js'])
            .find();

        filenames.forEach(f => {
            this._extensions[f] = require(f);
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
