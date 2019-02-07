import Bluebird from 'bluebird';
import cachegoose from 'cachegoose';

import logger from './logger';
import { SettingModel } from './models/setting';

export async function getSetting(key, defaultValue?, justValue = true) {
    const finder = SettingModel.findOne({
        key
    }) as any;

    return finder
        .cache(15 * 60, `SETTING_${key}`)
        .exec()
        .then(res => {
            logger.debug(['res', res]);
            if (!res) {
                return defaultValue;
            }
            return justValue ? res.value : res;
        })
        .catch(err => {
            logger.error(err);
            return defaultValue;
        });
}

export async function getSettings(keysAndDefaults: object) {
    return Bluebird.reduce(
        Object.keys(keysAndDefaults),
        async (acc, keyName) => {
            const foundSetting = {
                [keyName]: await getSetting(keyName, keysAndDefaults[keyName])
            };

            return { ...acc, ...foundSetting };
        },
        {}
    );
}

export async function setSetting(key, value) {
    return SettingModel.findOneAndUpdate(
        {
            key
        },
        {
            value
        },
        {
            upsert: true,
            new: true
        }
    )
        .exec()
        .then(res => {
            cachegoose.clearCache(`SETTING_${key}`);
            cachegoose.clearCache('ALL_SETTINGS');
            return res;
        });
}

export async function listSettings() {
    const finder = SettingModel.find() as any;
    return finder.cache(15 * 60, 'ALL_SETTINGS').exec();
}

export async function deleteSetting(key) {
    return SettingModel.deleteOne({
        key
    })
        .exec()
        .then(res => {
            cachegoose.clearCache(`SETTING_${key}`);
            cachegoose.clearCache('ALL_SETTINGS');
            return res;
        });
}
