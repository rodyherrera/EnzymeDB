/***
 * Copyright (C) Rodolfo Herrera Hernandez. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project root
 * for full license information.
 *
 * =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
 *
 * For related information - https://github.com/CodeWithRodi/EnzymeDB/
 * 
 *  A powerful object-relational mapping (ORM) and data manipulation library 
 * designed to simplify and streamline interaction with local storage 
 * and data in JavaScript applications.
 *
 * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
****/

import { v4 } from 'uuid';

// TODO:  In case there is no localStorage API in the 
// TODO: JavaScript execution environment, it means that Enzyme 
// TODO: is running outside of the browser, if so, we will simulate the localStorage API.
if(!global?.localStorage){
    const LocalStorage = (await import('./LocalStorage.js')).default;
    global.localStorage = new LocalStorage();
}

const ENZYME_MODEL_DEFAULT_OPTIONS = {
    NativeIdKeyName: 'Id',
    NativeCreatedAtKeyName: 'CreatedAt',
    ModelStorageId: 'Enzyme::Model::',
    DisableAutomaticallyIdCreation: false,
    DisableAutomaticallyCreationDate: false,
};

/*
    * Model.DeleteMany();
    * Model.DeleteOne();
  
    * Model.GetCollection();
    * Model.Exists();
    * Model.CountDocuments();

    * Model.Create();
    * Model.CreateMany();
    
    * Model.Find();
    * Model.FindOne();
    * Model.FindById();
    * Model.FindByIdAndDelete();
    * Model.FindByIdAndRemove();
    * Model.FindByIdAndUpdate();
    * Model.FindOneAndDelete();
    * Model.FindOneAndUpdate();

    * Model.UpdateOne();
    * Model.UpdateMany();
    * 
    * Model.DropCollection();
    * --
    * 
    * DropCollection
    * GetCollection
    * Overwrite
    * Save
    * FieldValidation
    * DocumentValidation
    * Exists
    * CountDocuments
    * Find
    * FindOne
    * FindAll
    * FindById
    * UpdateMany
    * FindByIdAndDelete
    * FindByIdAndUpdate
    * FindOneAndDelete
    * FindOneAndUpdate
    * UpdateOne
    * DeleteOne
    * DeleteMany
    * CreateMany
    * Create
*/
class Enzyme{
    constructor(Name, Schema, Options = ENZYME_MODEL_DEFAULT_OPTIONS){
        this.Name = Name;
        this.Methods = Schema?.Methods || {};
        delete Schema.Methods;
        this.NormalizeSchemaMethods();
        this.Schema = Schema;
        this.Options = { ...ENZYME_MODEL_DEFAULT_OPTIONS, ...Options };
        this.StorageID = this.Options.ModelStorageId + Name;
        this.References = {};
        this.Middlewares = { After: {}, Before: {} };
        this.DeactivatedMiddlewaresBuffer = [];
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Middlewares and custom methods
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    IsMiddlewareInternallyDeactivated(Middleware){
        return this.DeactivatedMiddlewaresBuffer.includes(Middleware);
    };

    ToggleInternallyDeactivatedMiddleware(Middleware){
        const IsDeactivated = this.IsMiddlewareInternallyDeactivated(Middleware);
        if(!IsDeactivated){
            return this.DeactivatedMiddlewaresBuffer.push(Middleware);
        }
        const MiddlewareIndex = this.DeactivatedMiddlewaresBuffer.indexOf(Middleware);
        this.DeactivatedMiddlewaresBuffer.splice(MiddlewareIndex, 1);
    };

    RegisterMiddleware(MiddlewareId, Block, Callback){
        this.Middlewares[Block][MiddlewareId] = Callback.bind(this);
    };

    NormalizeSchemaMethods(){
        const Methods = Object.keys(this.Methods);
        Methods.forEach((Method) => this.Methods[Method] = this.Methods[Method].bind(this));
    }

    After(MiddlewareId, Callback){
        this.RegisterMiddleware(MiddlewareId, 'After', Callback);
    };

    Before(MiddlewareId, Callback){
        this.RegisterMiddleware(MiddlewareId, 'Before', Callback);
    };

    CallMiddleware(MiddlewareId, Block, ...Arguments){
        const IsInternallyDeactivated = this.IsMiddlewareInternallyDeactivated(MiddlewareId);
        if(IsInternallyDeactivated)
            return;
        this.Middlewares?.[Block]?.[MiddlewareId]?.(...Arguments);
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Methods related to storage and collections
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    DropCollection(){
        const Collection = this.GetCollection();
        const Length = Collection.length;
        this.CallMiddleware('DropCollection', 'Before', { Collection, Length });
        localStorage.removeItem(this.StorageID);
        this.CallMiddleware('DropCollection', 'After', { Collection, Length });
        return {
            Status: 'Success',
            Documents: {
                Length,
                ...Collection
            }
        }
    }

    GetStorageBlock(){
        return JSON.parse(localStorage.getItem(this.StorageID)) || { Collection: [] };
    };

    GetCollection(){
        const { Collection } = this.GetStorageBlock();
        this.CallMiddleware('GetCollection', 'Before', { Collection });
        for(const Index in Collection){
            const Document = Collection[Index];
            this.NormalizeReferences(Document);
        }
        this.CallMiddleware('GetCollection', 'After', { Collection });
        return Collection;
    };

    Overwrite(Collection){
        this.CallMiddleware('Overwrite', 'Before', { Collection });
        localStorage.setItem(this.StorageID, JSON.stringify({ Collection }));
        this.CallMiddleware('Overwrite', 'After', { Collection });
    };

    Save(...Documents){
        this.CallMiddleware('Save', 'Before', { Documents });
        const CurrentCollection = this.GetCollection();
        CurrentCollection.push(...Documents);
        this.Overwrite(CurrentCollection);
        this.CallMiddleware('Save', 'After', { Documents, Collection: CurrentCollection });
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Field validation
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    Slugify(Text){
        return Text
            .toString()
            .toLowerCase()
            .trim()
            // ? Replaces spaces with '-'
            .replace(/\s+/g, '-')
            // ? Remove all non-word characters
            .replace(/[^\w\-]+/g, '')
            // ? Replace multiple '-' with single '-'
            .replace(/\-\-+/g, '-');
    };

    ParseFormattingRules(Field, Value){
        const Rules = this.Schema[Field];
        const FormattingRules = {
            LowerCase: Rules?.LowerCase && Value.toLowerCase(),
            UpperCase: Rules?.UpperCase && Value.toUpperCase(),
            Slugify: Rules?.Slugify && this.Slugify(Value),
            Trim: Rules?.Trim && Value.trim(),
            TrimStart: Rules?.TrimStart && Value.trimStart(),
            TrimEnd: Rules?.TrimEnd && Value.trimEnd()
        };
        const FormattingRuleIds = Object.keys(FormattingRules);
        for(const Rule of FormattingRuleIds){
            const IsTruthy = FormattingRules[Rule];
            (IsTruthy) && (Value = IsTruthy);
        }
        return Value;
    };

    GetEvaluatedField(Field, Value){
        const Rules = this.Schema[Field];
        const ValueLength = Value?.length || 0;
        // ! The validations are stored in an object, where each 
        // ! key will be the name of the rule or validation while 
        // ! the value will be the boolean result that will tell 
        // ! if the analyzed field is invalid or not.
        const Validations = {
            MaxLength: Rules?.MaxLength && ValueLength > Rules.MaxLength,
            MinLength: Rules?.MinLength && ValueLength < Rules.MinLength,
            Enumerate: Rules?.Enumerate && !Rules.Enumerate.includes(Value),
            Required: Rules?.Required && !Value,
            Validate: Rules?.Validate && !Rules.Validate(Value),
            Type: Rules?.Type && Value && ( 
                ( Rules.Type === Array && !Array.isArray(Value)) ||
                ( Rules.Type === String && (typeof Value !== 'string' || !Value instanceof String) ) ||
                ( Rules.Type === Object && typeof Value !== 'object' ) ||
                ( Rules.Type === Date && !Date.parse(Value) ) ||
                ( Rules.Type === Number && isNaN(Value) ) ),
            Unique: Rules?.Unique && this.Buffer.find((Document) => Document[Field] === Value),
            Max: Rules?.Max && Value > Rules.Max,
            Min: Rules?.Min && Value < Rules.Min
        };
        return Validations;
    };

    IsFieldInvalid(Field, Value){
        if(!Field in this.Schema){
            return true;
        }
        const ValueLength = Value?.length;
        this.CallMiddleware('FieldValidation', 'Before', { Field, Value });
        const EvaluatedField = this.GetEvaluatedField(Field, Value);
        // ! Object.keys is used to create an array with all the 
        // ! keys of the object that has the validations, since each 
        // ! key is the name of the rule, and in case a field does not 
        // ! meet the required validations we can provide information about 
        // ! what has failed, where the name of the rule is also included.
        const ValidatedRules = Object.keys(EvaluatedField);
        for(let Iterator = 0; Iterator < ValidatedRules.length; Iterator++){
            const Rule = ValidatedRules[Iterator];
            const IsValidationInvalid = EvaluatedField[Rule];
            if(!IsValidationInvalid)
                continue;
            // ! If the field is invalid, the execution of the 
            // ! cycle ends and the error is returned with the 
            // ! relevant information that it has failed.
            return {
                Rule: { Name: Rule, Value: this.Schema[Field][Rule] },
                Field: { Name: Field, Value, Length: ValueLength }, 
            };
        }
        this.CallMiddleware('FieldValidation', 'After', { Field, Value });
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Methods related to IDs 
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    GetDocumentId(Document){
        const Id = Document[this.Options.NativeIdKeyName];
        return Id;
    };

    GetByIdQuery(Id){
        const Parameter = this.Options.NativeIdKeyName;
        const Query = { [Parameter]: Id };
        return Query;
    };

    IsCallable(MaybeCallable){
        return (MaybeCallable instanceof Function);
    };

    HandleNativeParameters(Document){
        const {
            DisableAutomaticallyIdCreation,
            DisableAutomaticallyCreationDate,
            NativeCreatedAtKeyName,
            NativeIdKeyName
        } = this.Options;
        (!Document?.Id && !DisableAutomaticallyIdCreation) && (Document[NativeIdKeyName] = v4());
        (!Document?.CreatedAt && !DisableAutomaticallyCreationDate) && (Document[NativeCreatedAtKeyName] = new Date());
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Validation of documents
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    NormalizeReferences(Document){
        for(const Reference in this.References){
            const { Model, Documents } = this.References[Reference];
            const Id = this.GetDocumentId(Document);
            const { Field, Value } = Documents[Id];
            const ReferencedObject = Model.FindOne({ [Field]: Value });
            Document[Reference] = ReferencedObject.Document;
        }
        return Document;
    };
    
    HasFieldReference(Field, Value, Document){
        const Rules = this.Schema[Field];
        if(!Rules?.Reference)
            return;
        const Model = Rules.Reference;
        const ReferencedField = Rules?.Field || Model.Options.NativeIdKeyName;
        const HasModelReferencedDocument = Model.FindOne({ [ReferencedField]: Value });
        if(HasModelReferencedDocument.Status !== 'Success'){
            return { Field: 'Reference', Status: HasModelReferencedDocument.Status };
        }
        const DocumentId = this.GetDocumentId(Document);
        this.References[Field] = {
            Model,
            Documents: {
                [DocumentId]: {
                    Field: ReferencedField,
                    Value
                },
                ...(this.References?.[Field]?.Documents || [])
            }
        };
    }

    IsDocumentInvalid(Document){
        this.HandleNativeParameters(Document);
        const Fields = Object.keys(this.Schema);
        this.CallMiddleware('DocumentValidation', 'Before', { Fields, Document });
        // ! In the event that the field does not comply with the 
        // ! validations or the rules of the model schema, information about 
        // ! the error triggered will be returned, therefore, we use a for 
        // ! loop since this makes it possible to end the execution of the 
        // ! loop and return immediately, in comparison with "forEach" for example.
        for(let Iterator = 0; Iterator < Fields.length; Iterator++){
            const Field = Fields[Iterator];
            const Rules = this.Schema[Field];
            if(Rules?.Default && !Document?.[Field]){
                // ? { Default: new Date } | { Default: 'Some Default Value' }
                Document[Field] = (this.IsCallable(Rules.Default)) 
                    ? (Rules.Default()) 
                    : (Rules.Default);
            }
            const Value = Document?.[Field];
            const HasReference = this.HasFieldReference(Field, Value, Document);
            if(HasReference){
                return HasReference;
            }
            (Value) && (Document[Field] = this.ParseFormattingRules(Field, Value));
            const IsFieldInvalid = this.IsFieldInvalid(Field, Value);
            if(IsFieldInvalid){
                // ! If the field is NOT valid, information 
                // ! about the error triggered will be returned.
                return IsFieldInvalid;
            }
            this.CallMiddleware('DocumentValidation', 'After', { 
                Fields, 
                Document, 
                IsFieldInvalid, 
                Value, 
                HasReference 
            });
        }
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Search and counting methods
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    Exists(Query){
        this.CallMiddleware('Exists', 'Before', { Query });
        this.ToggleInternallyDeactivatedMiddleware('FindOne');
        const { Document } = this.FindOne(Query);
        this.ToggleInternallyDeactivatedMiddleware('FindOne');
        this.CallMiddleware('Exists', 'After', { Query, Document });
        return Document;
    };

    CountDocuments(...Queries){
        const FormatResponse = (Documents) => {
            const Length = Documents.length;
            this.CallMiddleware('CountDocuments', 'After', { Queries, Documents, Length });
            return { Documents, Length };
        };
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        this.CallMiddleware('CountDocuments', 'Before', { Queries });
        if(!Queries.length){
            const Collection = this.GetCollection();
            return FormatResponse(Collection);
        }
        const { MatchedDocuments } = this.PerformQuery({ Queries });
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        return FormatResponse(MatchedDocuments);
    };

    HandleQueryMatch = ({ Document, Query, MatchCallback, UpdateCallback }) => {
        const QueryFields = Object.keys(Query);
        const IsMatch = QueryFields.every((Field) => {
            const MatchStatus = Document[Field] === Query[Field];
            (MatchStatus && this.IsCallable(MatchCallback)) && (MatchCallback(Document));
            return MatchStatus;
        });
        return (UpdateCallback) ? (UpdateCallback(Document, IsMatch)) : (IsMatch);
    };

    PerformQuery({ Queries, UpdateCollection, UpdateCallback, Method = 'forEach', Middleware = undefined }){
        const MatchedDocuments = [];
        const InvalidDocuments = [];
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        let Collection = this.GetCollection();
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        this.CallMiddleware(Middleware, 'Before', { Collection, Queries });
        Queries.forEach((Query) => {
            const Operation = Collection[Method]((Document) => {
                const IsMatch = this.HandleQueryMatch({
                    Document, 
                    Query, 
                    UpdateCallback,
                    MatchCallback: (Document) => {
                        const IsDocumentInvalid = this.IsDocumentInvalid(Document);
                        ((IsDocumentInvalid) ? (InvalidDocuments) : (MatchedDocuments)).push(Document);
                    }
                });
                return (Method === 'filter') ? (!IsMatch) : (IsMatch); 
            });
            (UpdateCollection) && (Collection = Operation);
        });
        this.CallMiddleware(Middleware, 'After', { Collection, Queries, MatchedDocuments });
        return { 
            Collection,
            MatchedDocuments,
            InvalidDocuments
        };
    };

    FindAll(){
        this.ToggleInternallyDeactivatedMiddleware('CountDocuments');
        this.CallMiddleware('FindAll', 'Before');
        const { Documents, Length } = this.CountDocuments();
        this.CallMiddleware('FindAll', 'After', { Documents, Length });
        this.ToggleInternallyDeactivatedMiddleware('CountDocuments');
        return { Documents, Length };
    }

    Find(...Queries){
        const { MatchedDocuments } = this.PerformQuery({ Queries, Middleware: 'Find' });
        return { 
            Status: 'Success', 
            Documents: MatchedDocuments 
        };
    };

    FindOne(Query){
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Middleware: 'FindOne' 
        });
    };

    FindById(Id){
        const Query = this.GetByIdQuery(Id);
        return this.PerformQueryAndReturnOnMatch({ 
            Query,
            Middleware: 'FindById' 
        });
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Update Methods
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    PerformQueryAndReturnOnMatch({ Query, Update = undefined, Delete = false, Middleware = undefined }){
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        const Collection = this.GetCollection();
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        this.CallMiddleware(Middleware, 'Before', { Query, Update, Delete, Collection });
        let MatchedDocument = undefined;
        let UpdatedDocument = undefined;
        for(let Iterator = 0; Iterator < Collection.length; Iterator++){
            const Document = Collection[Iterator];
            const IsMatch = this.HandleQueryMatch({ Document, Query });
            if(!IsMatch)
                continue;
            MatchedDocument = Document;
            if(Update){
                delete Update[this.GetDocumentId(Document)];
                UpdatedDocument = { ...Document, ...Update };
                const IsDocumentInvalid = this.IsDocumentInvalid(UpdatedDocument);
                if(IsDocumentInvalid)
                    return IsDocumentInvalid;
                Collection[Iterator] = UpdatedDocument;
            }
            (Delete) && (Collection.splice(Iterator, 1));
            break;
        }
        if(!MatchedDocument){
            return {
                Status: 'DocumentNotFound',
                Collection
            };
        }
        (Update || Delete) && (this.Overwrite(Collection));
        this.CallMiddleware(Middleware, 'After', { Query, Update, Delete, Collection, MatchedDocument, UpdatedDocument });
        return { 
            Status: 'Success', 
            Collection, 
            Document: MatchedDocument,
            ...(UpdatedDocument && ({ UpdatedDocument }))
        };
    };

    UpdateMany(Query, Update){
        delete Update[this.GetDocumentId(Query)];
        const { Collection, MatchedDocuments, InvalidDocuments } = this.PerformQuery({
            Queries: [Query],
            Method: 'map',
            UpdateCollection: true,
            Middleware: 'UpdateMany',
            UpdateCallback: (Document, IsMatch) => (IsMatch) ? ({ ...Document, ...Update }) : (Document)
        });
        this.Overwrite(Collection);
        return {
            Status: 'Success',
            UpdatedDocuments: MatchedDocuments,
            InvalidDocuments,
            Collection
        };
    };

    FindByIdAndDelete(Id){
        const Query = this.GetByIdQuery(Id);
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Delete: true, 
            Middleware: 'FindByIdAndDelete' 
        });
    };

    FindByIdAndUpdate(Id, Update){
        const Query = this.GetByIdQuery(Id);
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Update, 
            Middleware: 'FindByIdAndUpdate' 
        });
    };

    FindOneAndUpdate(Query, Update){
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Update, 
            Middleware: 'FindOneAndUpdate' 
        });
    };

    FindOneAndDelete(Query){
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Delete: true, 
            Middleware: 'FindOneAndDelete' 
        });
    }

    UpdateOne(Query, Update){
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Update, 
            Middleware: 'UpdateOne' 
        });
    };

    // ! Removal methods
    DeleteOne(Query){
        return this.PerformQueryAndReturnOnMatch({ 
            Query, 
            Delete: true, 
            Middleware: 'DeleteOne' 
        });
    };

    DeleteMany(...Queries){
        this.CallMiddleware('DeleteMany', 'Before', { Queries });
        const { Collection, MatchedDocuments } = this.PerformQuery({
            Queries, Method: 'filter', UpdateCollection: true, });
        this.Overwrite(Collection);
        this.CallMiddleware('DeleteMany', 'After', { Queries, Collection, MatchedDocuments });
        return {
            Status: 'Success',
            Collection,
            DeletedDocuments: MatchedDocuments
        }
    };

    /*
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
        - Creation Methods
        #=#=#=#=#=#=#=#=#=#=#=#=#=#
    */
    CreateMany(...Documents){
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        this.CallMiddleware('CreateMany', 'Before', { Documents });
        const InvalidDocuments = [];
        let Collection = this.GetCollection();
        this.Buffer = Collection;
        for(const Document of Documents){
            const IsInvalid = this.IsDocumentInvalid(Document);
            if(IsInvalid){
                InvalidDocuments.push({ ...IsInvalid, Document });
            }else{
                this.Buffer.push(Document);
            }
        }
        delete this.Buffer;
        if(InvalidDocuments.length >= 1){
            return {
                Status: 'Validation::Error',
                Documents: InvalidDocuments
            }
        }
        this.Save(...Documents);
        this.CallMiddleware('CreateMany', 'After', { Documents, InvalidDocuments });
        Collection = this.GetCollection();
        this.ToggleInternallyDeactivatedMiddleware('GetCollection');
        return { 
            Status: 'Success', 
            Collection,
            CreatedDocuments: Documents 
        };
    };

    Create(Document){
        this.ToggleInternallyDeactivatedMiddleware('CreateMany');
        this.CallMiddleware('Create', 'Before', { Document });
        const { Status, Collection, CreatedDocuments } = this.CreateMany(Document);
        Document = CreatedDocuments?.[0];
        this.CallMiddleware('Create', 'After', { CreatedDocument: Document });
        this.ToggleInternallyDeactivatedMiddleware('CreateMany');
        return { 
            Status, 
            Collection, 
            Document
        };
    };
};

export default Enzyme;