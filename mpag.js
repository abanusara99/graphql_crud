const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const cors = require('cors');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/graphql_crud', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    age: { type: Number, required: true, index: true },
    email: { type: String, unique: true, required: true }
});

const User = mongoose.model('User', userSchema);

// Define GraphQL schema
const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    age: Int!
    email: String!
  }

  type Query {
    users: [User!]!
  }

  type Mutation {
    createUser(name: String!, age: Int!, email: String!): User
    deleteUser(id: ID!): User
    updateUser(id: ID!, name: String!, age: Int! , email: String!): User
  }
`);

// Define root resolver
const root = {
  users: async () => {
    try {
      return await User.find();
    } catch (err) {
      console.error('Error fetching users:', err);
      throw new Error('Failed to fetch users');
    }
  },
  createUser: async ({ name, age, email }) => {
    const user = new User({ name, age, email });
    try {
      return await user.save();
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  },
  deleteUser: async ({ id }) => {
    try {
      return await User.findByIdAndDelete(id);
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  },
  updateUser: async ({ id, name, age, email }) => {
    try {
      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      // Update user data
      existingUser.name = name || existingUser.name;
      existingUser.age = age || existingUser.age;
      existingUser.email = email || existingUser.email;
      
      // Save updated user
      const updatedUser = await existingUser.save();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  
  
};

// Create Express server
const app = express();

// Enable CORS for all routes
app.use(cors());

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/graphql`));
