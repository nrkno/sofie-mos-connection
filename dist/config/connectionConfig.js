"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConnectionConfig {
    constructor(init) {
        this._profiles = {
            '0': false,
            '1': false,
            '2': false,
            '3': false,
            '4': false,
            '5': false,
            '6': false,
            '7': false
        };
        Object.assign(this, init);
    }
    /** */
    get profiles() {
        return this._profiles;
    }
    /** */
    set profiles(profileSupport) {
        let atLeastOneOtherProfile = false;
        // profile 0 is mandatory
        if (profileSupport['0'] === true) {
            this._profiles['0'] = true;
        }
        else {
            throw new Error(`Invalid MOS configuration: Profile 0 is mandatory.`);
        }
        // Profile 1 depends on 0
        if (profileSupport['1'] === true) {
            if (!this._profiles['0'] === true) {
                throw new Error(`Invalid MOS configuration: Profile 1 depends on Profile 0.`);
            }
            else {
                this._profiles['1'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // Profile 2 depends on 0 and 1
        if (profileSupport['2'] === true) {
            if (!(this._profiles['0'] === true && this._profiles['1'] === true)) {
                throw new Error(`Invalid MOS configuration: Profile 2 depends on Profile 0 and 1.`);
            }
            else {
                this._profiles['2'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // Profile 3 depends on 0, 1 and 2
        if (profileSupport['3'] === true) {
            if (!(this._profiles['0'] === true && this._profiles['1'] === true && this._profiles['2'] === true)) {
                throw new Error(`Invalid MOS configuration: Profile 3 depends on Profile 0, 1 and 2.`);
            }
            else {
                this._profiles['3'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // Profile 4 depends on 0, 1 and 2
        if (profileSupport['4'] === true) {
            if (!(this._profiles['0'] === true && this._profiles['1'] === true && this._profiles['2'] === true)) {
                throw new Error(`Invalid MOS configuration: Profile 4 depends on Profile 0, 1 and 2.`);
            }
            else {
                this._profiles['4'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // Profile 5 depends on 0, 1 and 2
        if (profileSupport['5'] === true) {
            if (!(this._profiles['0'] === true && this._profiles['1'] === true && this._profiles['2'] === true)) {
                throw new Error(`Invalid MOS configuration: Profile 5 depends on Profile 0, 1 and 2.`);
            }
            else {
                this._profiles['5'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // Profile 6 depends on 0, 1 and 2
        if (profileSupport['6'] === true) {
            if (!(this._profiles['0'] === true && this._profiles['1'] === true && this._profiles['2'] === true)) {
                throw new Error(`Invalid MOS configuration: Profile 6 depends on Profile 0, 1 and 2.`);
            }
            else {
                this._profiles['6'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // Profile 7 depends on 0, 1 and 2
        if (profileSupport['7'] === true) {
            if (!(this._profiles['0'] === true && this._profiles['1'] === true && this._profiles['2'] === true)) {
                throw new Error(`Invalid MOS configuration: Profile 7 depends on Profile 0, 1 and 2.`);
            }
            else {
                this._profiles['7'] = true;
                atLeastOneOtherProfile = true;
            }
        }
        // must support at least one other profile, other than Profile 0
        if (!atLeastOneOtherProfile) {
            throw new Error(`Invalid MOS configuration: Mos device must support at least one profile other than the mandantory Profile 0.`);
        }
    }
}
exports.ConnectionConfig = ConnectionConfig;
//# sourceMappingURL=connectionConfig.js.map