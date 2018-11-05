import filehound from 'filehound';
import path from 'path';

class ExtensionManager {
    private _extensions = {};

    async init() {
        const filenames = await filehound.create()
            .path(path.resolve(__dirname, '../extensions'))
            .ext(['ts', 'js'])
            .find();

        filenames.forEach(f => {
            this._extensions[f] = require(f);
        });
    }
}

export default new ExtensionManager();
