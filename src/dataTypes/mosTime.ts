export default class MosTime {

    private _time:Date

    /** */
    constructor (timestamp?: Date|number|string) {
        if (timestamp) {
            switch (typeof timestamp) {
                case 'number': 
                    break;
                case 'string': 
                    break;
                case 'object': 
                    break;
            }

        }
    }

    toString ():string {

    }
}