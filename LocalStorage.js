/***
 * Copyright (C) Rodolfo Herrera Hernandez. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project root
 * for full license information.
 *
 * =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
 *
 * For related information - https://github.com/CodeWithRodi/EnzymeDB/
 * 
 * A powerful object-relational mapping (ORM) and data manipulation library 
 * designed to simplify and streamline interaction with local storage 
 * and data in JavaScript applications.
 *
 * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
****/

class LocalStorage{
    constructor(){
        this.Storage = new Map();
    };

    getItem(Key){
        return this.Storage.get(Key) || null;
    };

    setItem(Key, Value){
        this.Storage.set(Key, Value);
    }

    removeItem(Key){
        this.Storage.delete(Key);
    }

    clear(){
        this.Storage.clear();
    }

    key(Index){
        Index = Index || 0;
        return Array.from(this.Storage.keys())[Index];
    }
    
    get length(){
        return this.Storage.size;
    }
};

export default LocalStorage;