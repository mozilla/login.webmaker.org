## Webmaker User Data Model

Our Webmaker users are stored in SQL-like databases (according to how the server is configured), and use this data model:

*NOTE*: There may be more detail about each field available in the codebase itself. The information provided here is intended to specify datatype and general restrictions.

```javascript
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    username: {
      type: "VARCHAR(20)",
      allowNull: false,
      unique: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isCollaborator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isSuspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sendNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sendEngagements: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sendEventCreationEmails: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    wasMigrated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }
```

## Login RESTful APIs

Interaction with the Login server is controlled by exposing a specific set of APIs that allow client-side and server-side calls to use CRUD operations on the Webmaker user model. They are:

### Authentication

Depending on the API route, a combination of four types of authentication will be required.

#### 1. Basicauth
Some routes allow standard <a href="https://developer.mozilla.org/en-US/Persona?redirectlocale=en-US&redirectslug=Persona">basicauth credentials</a> to be used **only** in the case of server-to-server communication. This key/pass combination is set in the Login server .env file, and passed using the URI format: *https://user:pass@domain.com*

**Note:** Client-side code should *never* use basicauth to make API calls, since the user/pass combination is unencrypted.

#### 2. Persona Credentials
Ownership of an account is determined using <a href="https://developer.mozilla.org/en-US/Persona?redirectlocale=en-US&redirectslug=Persona">Mozilla's Persona SSO standard</a>. Routes with this requirement will detect if the client has authenticated with Persona before accessing the Login API.

In addition, each Webmaker user account is directly associated with a Persona account. This means that routes expecting a valid Webmaker account also require Persona authentication.

#### 3. Webmaker account (Persona required)
A route requiring a Webmaker account will check the email authenticated by Persona (see above) against the Login server's database of Webmakers to ensure a Webmaker account exists for that email. Most Webmaker accounts are only authorized to modify their own database entry using the Login API.

#### 4. Webmaker account with admin permissions (Persona required)
Some routes allow a Webmaker account with admin permissions to see and modify other Webmaker accounts in addition to their own. As above, Persona authentication provides the email address used to identify an admin Webmaker account.

### Creating, updating and deleting user accounts

#### 1. `POST /user` | *Create a new Webmaker account*

URI Parameters:

    None

Expected info:

    {
      email: STRING (specifically, persona email),
      username: STRING
    }

Return:

    {
      error: STRING,
      user: Webmaker User Object
    }

Security:

    Persona credentials

#### 2. `PUT /user/:email` | *(ADMIN) Update a Webmaker profile*

URI Parameters:

    :email - the "email" parameter of the Webmaker User model (see schema at top of page)

Expected PUT info:

    A JSON object containing the attributes being updated

Return:

    {
      err: STRING,
      user: Webmaker User Object (see schema at top of page)
    }

Security:

    Basicauth, Webmaker account (admin)

#### 3. `PUT /account/update` | *Update a User in the Webmaker database that you own*

URI Parameters:

    :email - the "email" parameter of the Webmaker User model (see schema at top of page)

Expected info:

    None

Return:

    {
      err: STRING
    }

Security:

    Basicauth, Webmaker account (owner), Webmaker account (admin)

#### 4. `DELETE /user/:email` | *(ADMIN) Delete a User from the Webmaker database*

URI Parameters:

    :email - the "email" parameter of the Webmaker User model (see schema at top of page)

Expected info:

    None

Return:

    {
      err: STRING
    }

Security:

    Basicauth, Webmaker account (admin)

#### 5. `POST /account/delete ` | *Delete a User from the Webmaker database*

URI Parameters:

    None

Expected info:

    None

Return:

    {
      err: STRING
    }

Security:

    Basicauth, Webmaker account (owner), Webmaker account (admin)

### Retrieving user data

#### 1. `GET /user/id/:id` | *Return a copy of the user's Webmaker User model object.*

URI Parameters:

    :id - the "id" parameter of the Webmaker User model (see schema at top of page)

Expected info:

    None

Return:

    {
      err: STRING,
      user: Webmaker User Object (see schema at top of page)
    }

Security:

    Basicauth for server-to-server. Otherwise, persona credentials + associated webmaker account. Unless they have admin permissions, users can only retrieve their own account details.

#### 2. `GET /user/username/:username` | *Return a copy of the user's Webmaker User model object*

Call Parameters:

    :username - the "username" parameter of the Webmaker User model (see schema at top of page)

Expected info:
    None

Return:

    {
      err: STRING,
      user: Webmaker User Object (see schema at top of page)
    }

Security:

    Basicauth for server-to-server. Otherwise, persona credentials + associated webmaker account. Unless they have admin permissions, users can only retrieve their own account details.

#### 3. `GET /user/email/:email` | *Return a copy of the user's Webmaker User model object.*

Call Parameters:

    :email - the "email" parameter of the Webmaker User model (see schema at top of page)

Expected info:

    None

Return:

    {
      err: STRING,
      user: Webmaker User Object (see schema at top of page)
    }

Security:

    Basicauth for server-to-server. Otherwise, persona credentials + associated webmaker account. Unless they have admin permissions, users can only retrieve their own account details.
