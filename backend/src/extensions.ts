import filehound from 'filehound';
import path from 'path';
import { isFunction, get } from 'lodash';

class ExtensionManager {
    private _hasInit = false;
    private _extensions = {};

    async init() {
        const filenames = await filehound.create()
            .path(path.resolve(__dirname, '../extensions'))
            .ext(['ts', 'js'])
            .find();

        filenames.forEach(f => {
            this._extensions[f] = require(f);
        });

        this._hasInit = true;
    }

    getGraphQLConfig() {
        if (this._hasInit) {
            const keys = Object.keys(this._extensions);
            return keys.map(e => {
                const ext = this._extensions[e];
                if (ext && isFunction(get(ext, 'graphQLConfig'))) {
                    return ext.graphQLConfig();
                }
            }).filter(e => !!e);
        }
    }
}

export default new ExtensionManager();
