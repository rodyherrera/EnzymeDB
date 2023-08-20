# EnzymeDB
Enzyme is an abstraction layer for the `localStorage Web API` provided by the browser, allowing you to define models and schemas for storing documents locally while also simplifying interaction with localStorage through intuitive and expressive easy-to-use methods.

```bash
# Installation (NodeJS v18.0.0)
npm i enzyme-db
```

## Table of Contents
  - [Enzyme DB](#enzyme-db)
  - [When or why should you use it?](#when-or-why-should-you-use-it)
  - [Built by developers, for developers!](#built-by-developers-for-developers)
  - [Basic Usage](#basic-usage)
    - [Initialization](#initialization)
    - [Document creation](#document-creation)
    - [Document search](#document-search)
    - [Document update](#document-update)
    - [Document deletion](#document-deletion)
  - [Rules defined within the schema](#rules-defined-within-the-schema)
  - [Middlewares](#middlewares)
    - [Registering a middleware](#registering-a-middleware)
  - [References between models](#references-between-models)
  - [Better practices with Enzyme](#better-practices-with-enzyme)
  - [Security and Data Privacy](#security-and-data-privacy)
  - [Performance Considerations](#performance-considerations)
  - [Exploring the class](#exploring-the-class)
    - [constructor(Name, Schema, Options)](#constructorname-schema-options)
    - [Model.DropCollection()](#modeldropcollection)
    - [GetCollection()](#getcollection)
    - [Overwrite(Collection)](#overwritecollection)
    - [Save(...Documents)](#save-documents)
    - [IsFieldInvalid(Field, Value)](#isfieldinvalidfield-value)
    - [Exists(Query)](#existsquery)
    - [CountDocuments(...Queries)](#countdocumentsqueries)
    - [Find(...Queries)](#findqueries)
    - [FindOne(Query)](#findonequery)
    - [FindAll()](#findall)
    - [UpdateMany(Query, Update)](#updatemanyquery-update)
    - [FindByIdAndDelete](#findbyidanddelete)
    - [FindByIdAndUpdate(Id, Update)](#findbyidandupdateid-update)
    - [FindOneAndUpdate(Query, Update)](#findoneandupdatequery-update)
    - [FindOneAndDelete(Query)](#findoneanddeletequery)
    - [UpdateOne(Query, Update)](#updateonequery-update)
    - [DeleteOne(Query)](#deleteonequery)
    - [DeleteMany(...Queries)](#deletemanyqueries)
    - [CreateMany(...Documents)](#createmanydocuments)
    - [Create(Document)](#createdocument)
  - [Examples and Use Cases](#examples-and-use-cases)
  - [Enzyme under MIT license](#enzyme-under-mit-license)

## When or why should you use it?
- **Data persistence**: If your web application needs certain data to persist between the different sessions that a user may have.

- **User Experience Optimization**: Storing certain data locally can significantly improve the user experience within your web application by reducing the need to make requests to the server each time that data is needed, allowing you to have greater speed loading and printing by the client.

- **Offline Web Apps**: When you have a Progressive Web App (PWA) that works without an Internet connection, it can be useful to use Enzyme to store modeled data needed for the PWA to work seamlessly when the user is offline.

## Built by developers, for developers!
- **Data Modeling**: Enzyme allows you to define models to store the data locally in the browser, defining in the model the structure of the document, the fields and the types of data guaranteeing the coherence of the data that a document will have within the collection.

- **Validations**: Likewise, the library provides you with a validation system, where it allows you to define custom rules in addition to the native ones in order to validate the data before it is stored in the collection, helping you maintain the integrity of the data and ensure that they comply with the established criteria.

- **Queries and Operations**: It facilitates the consultation of documents through the use of expressive, intuitive and easy-to-use methods.

- **Middlewares**: Enzyme allows you to register middlewares which are executed before or after certain operations, such as save, update, delete, validate, among others. Allowing you to execute custom logic at different stages of a document's lifecycle in the execution context.

- **References**: Although localStorage is not a database, much less relational, Enzyme allows you to create relationships with other models and perform different types of operations between them according to your documents.

- **Schemas**: Enzyme allows you to create schemas for the data, helping you to establish a predefined structure for the documents, useful to control the evolution of the data over time.

## Basic Usage

#### Initialization
To create a model, you must provide the name of the model along with a schema and custom options (optionally).

```javascript
const BlogSchema = {
    Title: {
        Type: String,
        MaxLength: 32,
        MinLength: 4,
        Slugify: true,
        LowerCase: true,
        Required: true
    },
    Description: {
        Type: String,
        MaxLength: 255,
        MinLength: 32,
        Default: 'Default Description'
    }
};

const Options = {};

const BlogModel = new Enzyme('Blog', BlogSchema, Options);

```
Consider that among the available options are:

| Option    | Explanation |
| -------- | ------- |
| **NativeIdKeyName** | This option allows you to specify the name of the field that will be used as a unique identifier for each document in the model. By default, the name 'Id' is used as the identifier. You can change it to any other desired name. For example, if you set NativeIdKeyName: 'DocumentId', documents in that model will use 'DocumentId' as their identifier. |
| **NativeCreatedAtKeyName** | Here you can set the name of the field that will store the creation date of each document in the model. By default, the name 'CreatedAt' is used. If you want to use a different name for this field, you can set it here. |
| **ModelStorageId** | This option defines the identifier that is used in localStorage to store the documents of this model. By default, 'Enzyme::Model::' is used as the prefix. The model name will be concatenated to this prefix to form the full key in localStorage. |
| **DisableAutomaticallyIdCreation** | Setting this option to true will disable the automatic creation of a unique identifier when a new document is created in the model. This means that you will have to explicitly provide an identifier for each new document. |
| **DisableAutomaticallyCreationDate** | Setting this option to true will automatically prevent the creation of a 'CreatedAt' field for each new document. This means that you will have to manually handle the creation date assignment. |

#### Document creation
You can create a document using the methods: `Create()` or `CreateMany()`

```javascript
const NewPost = {
    Title: 'This is an example',
    Description: 'Enzyme is elegant abstraction for the localStorage Web API'
};

const Result = BlogModel.Create(NewPost);
```

#### Document search
Using the `Find()`, `FindOne()`, `FindById()` methods, you can find documents within a given collection stored in a model.

```javascript
const Query = { Title: 'this-is-an-example' };
const SearchResult = BlogModel.Find(Query);
```

#### Document update
With the help of the `UpdateOne()`, `UpdateMany()` or `FindByIdAndUpdate()` methods you can update documents.

```javascript
const UpdateQuery = { Title: 'this-is-an-example' };
const UpdateData = { Description: 'This is an new description for the documentation example' };
const UpdateResult = BlogModel.UpdateOne(UpdateQuery, UpdateData);
```

#### Document deletion
Using the `DeleteOne()`, `DeleteMany()` and `FindByIdAndDelete` methods you can delete documents within the collection.

```javascript
const DeleteQuery = { Title: 'this-is-an-example' };
const DeleteResult = BlogModel.DeleteOne(DeleteQuery);
```

## Rules defined within the schema
The rules that are defined within a field in the schema of an Enzyme model allow establishing certain criteria in order to verify and validate the input data that will be stored in the collection of said model. Each rule will apply to the corresponding field value and these can help ensure the consistency and integrity of the data that will be stored in the collection. You will then be presented with the list of available rules.

| Rule    | Explanation |
| -------- | ------- |
| **MaxLength** | The value must not exceed the specified maximum length. |
| **MinLength** | The value must meet the specified minimum length. |
| **Enumerate** | The value must be within the set of enumerated values. |
| **Required** | The value is required and cannot be empty. |
| **Validate** | A custom validation function is applied to the value and must return false to satisfy the validation. |
| **Type** | The value must be of the specified data type (Array, String, Object, Date, Number) and comply with the corresponding format. |
| **Unique** | The value must be unique in the entire collection for that field. |
| **Max** | The value must be less than or equal to the specified maximum value. |
| **Min** | El valor debe ser mayor o igual al valor mínimo especificado. |

In addition to the validation rules established in the schema that a field must have, Enzyme also allows you to define rules that will modify the value of a field prior to being stored locally, allowing you to perform transformations on the original value to ensure that it complies with the requirements before storage, then you will be presented with the list of rules available for it:

| Rule    | Explanation |
| -------- | ------- |
| **LowerCase** | Converts the field value to lowercase if the corresponding rule is true. |
| **UpperCase** | Converts the field value to uppercase if the corresponding rule is true. |
| **Slugify** | Aplica una transformación para convertir el valor del campo en un formato de "slug", útil para generar URL amigables. |
| **Trim** | Removes whitespace at the beginning and end of the field value. |
| **TrimStart** | Removes whitespace at the beginning of the field value. |
| **TrimEnd** | Removes trailing whitespace from the field value. |

These rules are useful for normalizing the data and making sure it follows the standards before persisting. Note that these parameters apply only if the field is valid.

## Middlewares 
Middlewares act as intermediaries between different parts of your application, allowing the execution of additional actions before or after an operation within the model. The latter allow the library to be more flexible regarding the implementation of functionalities without the need to modify or alter the main code.

#### Registering a middleware
```javascript
MyModel.Before(Middleware, Callback);
```
Consider that the second parameter, `Callback`, must be expressed with the JavaScript `function` keyword and not as an `arrow function`, although it will work, from the abstraction layer the `this` object is binded, allowing you to access it directly from `function(){}` to the internal functionalities of the model, for example `this.GetCollection()`.

Example using the Creation Middleware.

```javascript
Model.Before('Create', function(){
    console.log('[BEFORE]: Create.');
});

Model.After('Create', function(){
    console.log('[AFTER]: Create.');
});

Model.Create({ Foo: 'Bar' });
```
Where `Model.Before` is the equivalent of `schema.pre` in `mongoose` and `Model.After` is `schema.post`.

| Middleware    | Function method |
| -------- | ------- |
| **DropCollection** | Removes all existing documents in a collection from the model. |
| **GetCollection** | Retrieves all the documents in the collection in the model. |
| **Overwrite** | Replaces the current collection in the model with a new collection provided. |
| **Save** | Adds new documents to the existing collection in the model and stores them. |
| **FieldValidation** | Performs custom validations on a specific field in the document based on rules defined in the model schema. |
| **DocumentValidation** | Perform custom validations on the entire document before saving it to the collection. |
| **Exists** | Checks if a document exists that matches the provided query. |
| **CountDocuments** | Counts the number of documents that match the delivered queries. |
| **Find** | Search and retrieve documents matching the given queries. |
| **FindOne** | Find and retrieve a document matching the given query. |
| **FindAll** | Retrieves all the documents in the collection in the model. |
| **FindById** | Find and retrieve a document by its ID. |
| **UpdateMany** | Updates one or more documents that match the given query. |
| **FindByIdAndDelete** | Find and delete a document by its ID. |
| **FindByIdAndUpdate** | Find and update a document by its ID. |
| **FindOneAndDelete** | Find and delete a document matching the given query. |
| **FindOneAndUpdate** | Find and update a document that matches the given query. |
| **UpdateOne** | Updates a document that matches the given query. |
| **DeleteOne** | Deletes a document matching the given query. |
| **DeleteMany** | Deletes one or more documents that match the given queries. |
| **CreateMany** | Create one or more documents in the collection. |
| **Create** | Create a document in the collection. |

## References between models.
In Enzyme, it is possible to establish relationships between models through references, allowing the linking of documents in one model with documents belonging to another model.

For example, suppose we have two models: `Author` and `Book`, and we want to establish a relationship between them, where a `Book` has an `Author` in its schema.

#### Creating the Author model.

```javascript
const AuthorSchema = {
  Name: {
    Type: String
  }
};

const Author = new Enzyme('Author', AuthorSchema);
```

#### Creating the Book model and referencing the Author model.

```javascript
const BookSchema = {
  Title: {
    Type: String
  },
  Author: {
    // Set the reference to the Author model here
    Reference: Author,
    // // The field in the Book model that will contain the reference to the author
    Field: 'Id' 
  }
};

const Book = new Enzyme('Book', BookSchema);
```

#### Creating documents in the models and establishing the relationship.

```javascript
// Create an author in the Author model
const { Document: AuthorDocument } = Author.Create({ Name: 'Rodolfo Herrera' });

// Create a book in the Book model and set the reference to the author
const { Document: BookDocument } = Book.Create({
  Title: 'Javascript Complete Course',
  // Set reference to author id
  Author: AuthorDocument.Id
});

console.log(Book.GetCollection());
/*
[
  {
    Title: 'Javascript Complete Course',
    Author: {
      Name: 'Rodolfo Herrera',
      Id: '19ed1dfa-b289-4376-9b10-fe4d049f11f9',
      CreatedAt: '2023-08-20T05:20:22.664Z'
    },
    Id: '02d35791-7883-4b05-9adb-c00e0af2dd26',
    CreatedAt: '2023-08-20T05:20:22.665Z'
  }
]
*/
```
In the example presented, a reference to the `Author` model has been created within the `Book` model schema. When creating a new book, we set the reference to the author's `Id` in the `Author` field, which is the field we've selected for the reference in the schema. In this way, we have established a relationship between the `Author` and `Book` models.

At the time that references are used, it is possible to access the author's details directly from the book document, which allows queries and related operations to be carried out in a much more efficient and structured way.

## Better practices with Enzyme
When implementing Enzyme into your application and defining models, schemas, and operations, it's important to follow best practices to ensure that your implementation's source code is organized, maintainable, and efficient. Following are some of the best practices for building your models, schematics, and operations with Enzyme.

- **Divide and Conquer**: Divide your models and schematics into separate files for each entity or document type, allowing you to keep your code organized while also making it easy to navigate when looking for specific definitions.

- **Reusable Models and Schemes**: If you have entities that share similar structures, you can consider creating reusable schemas so that they can be shared by two or more models, thus avoiding code duplication and simplifying maintenance.

- **Clear and Meaningful Names**: Use descriptive model, field, and method names. Make your code readable and understandable to both you and other developers.

- **Validations and Rules**: Use the validation rules that are natively provided by Enzyme in order to guarantee the security and integrity of the stored data.

- **Use of Middleware**: You may consider using middlewares for the purpose of encapsulating common logic or actions that need to be performed before or after certain operations allowing you to centralize the logic and maintain a clear flow in your code.

- **Avoid Complex Logic in Schemas**: Avoid including complex business logic within schemas, keep the latter out of schema definitions.

## Security and Data Privacy
The purpose of Enzyme is focused on simplifying the interaction with local storage by providing methods for data management. The security and privacy of information stored by the library will largely depend on how the library is implemented and used in conjunction with other security measures.

- **Physical Access to the Device**: Well, the data stored locally is subject to the physical security in which the application is executed. If the device is compromised or is accessible by unauthorized third parties, then the stored data could be in eventual risk.

- **Data Encryption**: Considering that Enzyme does not provide any data encryption by default, it is recommended to implement additional encryption measures in order to protect data stored locally. This could include encrypting the data before storing it using strong and secure methods.

- **Data Validation and Sanitization**: You must ensure that you sanitize and validate the data before storing it. You can prevent injection attacks and other types of malicious data manipulation.

- **Regulatory Compliance**: If the application in which you are integrating Enzyme handles personal or sensitive data, it is really important that you make sure that you fully comply with the existing privacy and data protection regulations that apply within your region. Considering regulations such as the General Data Protection Regulation (GDPR) in the European Union.

- **Privacy Policy and Consent**: Users of your application should be aware of how their data is stored and used locally by Enzyme if this stored data contains personal information or potentially sensitive data.

By combining Enzyme with good security and privacy practices, you can guarantee your users a safe and reliable experience within your application.

## Performance Considerations
Initially in the introduction to the documentation, we mentioned that Enzyme is an abstraction layer for local storage in the browser, using the localStorage API. You should consider that local storage in the browser has limitations, which in short include the amount of data it can handle efficiently. Although there is no absolute limit in terms of the amount of data that Enzyme allows you to store in your application, there are practical limitations that you should be aware of when handling large amounts of data.

- **Browser Storage Capacity**: Local storage in the browser, including localStorage, generally has a storage limit which may vary by browser and device. In some browsers this limit is around 5-10 MB per domain, in the case of Enzyme, per model. If you exceed this limit, the data may not be stored correctly or errors may be generated in between.

- **Perfomance**: As the amount of data stored increases, performance in terms of reading or accessing the data may become poor. Read and write operations may become slower as the amount of data increases.

- **Efficiency**: As much as Enzyme takes care of working as quickly and efficiently as possible, localStorage isn't exactly designed to handle large data sets efficiently.

Enzyme uses localStorage as storage, the above limitations and considerations largely apply to how Enzyme handles large amounts of data. If you have a need to handle large data sets or if your query and storage requirements are complex, you might consider other server-side database solutions or cloud storage services.

Enzyme may be suitable and work optimally for applications with more modest local storage needs, it is important to consider the practical limitations of localStorage and assess whether it is the best option for your application.

## Exploring the class
**constructor(Name, Schema, Options)**
In order to initialize an instance of the Enzyme class where the parameters are:
- `Name` (String): The name you want to give to the model you are creating, for example 'Blog'.
- `Schema` (Object): Object that describes the schema that the model documents should comply with.
- `Options` (Object, Optional): Custom options for the model.

#### Model.DropCollection()
It allows to eliminate all the existing documents that a certain collection houses based on an instance (model).
- `Return value`: None.

#### GetCollection()
Allows you to retrieve all documents from the collection in the model within localStorage.
- `Return value`: Document array.

#### Overwrite(Collection)
Allows you to replace the current collection in the model with a new provided collection, which will be written to the localStorage.
- Parameters:
    - `Collection` (Array): It must be the new collection of documents.
- `Return value`: None.

#### Save(...Documents)
It allows adding new documents to the existing collection within the model, which will be stored in localStorage.
- Parameters:
    - `Documents` (Objects): One or more documents that are passed as a parameter to the function to add them into the collection.
- `Return value`: None.

#### IsFieldInvalid(Field, Value)
Checks if a field delivered in the document is valid according to the rules defined in the model schema.
- Parameters:
    - `Field` (String): The name of the field that you want to validate.
    - `Value` (Any Kind): The value of the field that you want to validate.
- Return value (Object): The return will only be when a field does not comply with the validations. 
    - `Rule` (Object): In this context, Rule refers to the specific rule being evaluated (for example, `MaxLength`, `MinLength`, `Required`, etc.). A `Rule object` is created containing two properties:
        - `Name` (String): The name of the rule that is being evaluated (for example, "`MaxLength`").
        - `Value` (String): The specific value defined in the schema for that rule in the field in question (for example, the maximum length value allowed for `MaxLength`).
    - `Field` (Object): Similarly, a `Field object` is created that contains information about the field being evaluated:
        - `Name` (String): The name of the field being evaluated (for example, "`Title`").
        - `Value` (Any Kind): The current value of the field that failed validation.
        - `Length` (Number if Value is String else Undefined): The length of the field value, in the case of text type fields (for example, length of a character string).

#### Exists(Query)
Checks if there is a document that meets the query delivered as a parameter.
- Parameters:
    - `Query` (Object): Check that the document must comply.
- Return value (Object): If the document is found, it is returned.

#### CountDocuments(...Queries)
Counts the number of documents that match the queries delivered as a parameter.
- Parameters:
    - `Queries` (Objects): Queries to apply the filter to the document search.
- Return value (Object): 
    - `Documents` (Array of Objects): Documents available in the collection.
    - `Length` (Number): Number of documents available in the collection.

#### Find(...Queries)
Find all documents matching the given queries.
- Parameters:
    - `...Queries` (Objects): One or more queries that will be applied as a filter to find comments.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Documents` (Array of Objects): Contains the documents that matches.

#### FindOne(Query)
Allows you to find a document that matches the given query, if there are multiple documents, the first one found will be returned.
- Parameters:
    - `Query` (Object): Query to apply as a filter for the search.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Current collection of documents.
    - `Document` (Object): Contains the found document.

#### FindAll()
Gets all the documents that the collection of a respective model contains.
- Return value (Object): 
    - `Documents` (Array of Objects): Documents available in the collection.
    - `Length` (Number): Number of documents available in the collection.

#### UpdateMany(Query, Update)
Update one or more documents that match the query received.
- Parameters:
    - `Query` (Object): Query to apply as a filter for the selection of documents.
    - `Update` (Object): Update data.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `UpdatedDocuments` (Array of Objects): Updated documents.
    - `Collection` (Array of Objects): Collection of already updated documents.

#### FindByIdAndDelete
It finds a document within the collection according to its Id and proceeds to delete it after.
- Parameters:
    - `Id` (String): Identifier of the document to delete.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Contains the deleted document.

#### FindByIdAndUpdate(Id, Update)
Finds a specific document based on the Identifier provided as a parameter and updates it with the second provided parameter.
- Parameters:
    - `Id` (String): Identifier of the document to be updated.
    - `Update` (Object): Update data.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Original document before applying the update.
    - `UpdatedDocument` (Object): Contains the already updated document.

#### FindOneAndUpdate(Query, Update)
Finds a document that matches the provided query and updates it with the provided data. If there are multiple documents that match the search, the first of these is updated.
- Parameters:
    - `Query` (Object): Query that will be applied as a filter for the selection of the document.
    - `Update` (Object): Update data.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Original document before applying the update.
    - `UpdatedDocument` (Object): Contains the already updated document.

#### FindOneAndDelete(Query)
Finds a document that matches the given query and then deletes it.
- Parameters:
    - `Query` (Object): Query that will be applied for the selection of the document.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Contains the deleted document.

#### UpdateOne(Query, Update)
Updates a document that matches the supplied query.
- Parameters:
    - `Query` (Object): Query that will be applied for the selection of the document, if there are multiple coincidences, the first one will be chosen.
    - `Update` (Object): Update data.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Original document before applying the update.
    - `UpdatedDocument` (Object): Contains the already updated document.

#### DeleteOne(Query)
Deletes a document that matches the provided query.
- Parameters:
    - `Query` (Object): Query that will be applied for the selection of the document.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Contains the deleted document.

#### DeleteMany(...Queries)
Deletes one or more documents that match the queries provided as a parameter.
- Parameters:
    - `...Queries` (Objects): One or more queries for the selection of documents.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `DeletedDocuments` (Array of Objects): Contains the deleted documents.

#### CreateMany(...Documents)
Allows the creation of one or more documents within the collection.
- Parameters:
    - `...Documents` (Objects): One or more documents to create..
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `CreatedDocuments` (Array of Objects): Contains the created documents.

#### Create(Document)
Create a document in the collection.
- Parameters:
    - `Document` (Object): Document to create.
- Return value (Object): 
    - `Status` (String): Indicates the status of the operation. 
    - `Collection` (Array of Objects): Collection of already updated documents.
    - `Document` (Object): Document created.

## Examples and Use Cases
- **PWA with Dynamic Data**: In the context of a Progressive Web App (PWA), Enzyme can be useful for locally storing data necessary for the PWA to function without an internet connection. Where you could include product information, catalogs, schedules, etc.

- **Notes management**: You can use Enzyme to create a model which represents the notes in a notes application. Where each note could have a title, a content and a date. Users could create, update and delete notes locally using Enzyme, allowing for a better user experience by allowing you to access your notes even when offline.

- **Task lists in a productivity application**: If you have or want to create a to-do list application, you can use Enzyme for administration or management of a user's to-do list. Each task could contain a title, description and a status (whether it was completed or pending). Users could add new tasks, mark as completed, and delete them using Enzyme.

You can use Enzyme in any scenario where your application needs to store data locally in order to improve the user experience when using the latter. Whether it is to maintain personal information, manage content, track progress or ensure the availability of offline data. With Enzyme, you can greatly simplify interaction with local storage and help optimize your web application or PWA.

## Enzyme under MIT license
The MIT license (Massachusetts Institute of Technology License) is a permissive open source software license. It allows developers to use, modify, distribute and sublicense the software without material restrictions. The MIT license is characterized by its simplicity and does not impose many legal restrictions on users.

- **Rights Of Use**: You might consider mentioning that Enzyme is available under the MIT license, so users have the right to use it in their projects at no cost.

- **Modification and Distribution**: Enzyme's source code can be modified and adapted to the specific needs of an application and distribute its modified versions.

...