const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "rdj82jd92j3d92jd92jd2",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
  const { email, password } = request.body;

  // searches through the USERS array to find and return the first user object whose email matches the email that was submitted in the login form
  const user = USERS.find((u) => u.email === email);

  // If no user found or password doesn't match
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return response.render("login", {
      error: "Invalid email or password",
    });
  }

  // create a safe version of the user object (without the password), store it in the session to maintain the login state
  const { password: _, ...userWithoutPassword } = user;
  request.session.user = userWithoutPassword;
  //then redirect the user to the landing page.
  response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const {
    username,
    email,
    password,
    "confirm-password": confirmPassword,
  } = request.body;

  // Added a cute confirm password. It's not in the scope but it annoyed me that it wasn't there :D 
  if (password !== confirmPassword) { 
    return response.render("signup", { 
      error: "Passwords do not match", 
    });
  }

  // Check if email already exists
  if (USERS.find((u) => u.email === email)) {
    return response.render("signup", {
      error: "Email already exists",
    });
  }

  // Create new user
  const newUser = {
    id: USERS.length + 1,
    username,
    email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role: "user",
  };

  USERS.push(newUser);
  response.redirect("/login");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  // Check if user is logged in
  if (!request.session.user) {
    return response.redirect("/login");
  }

  // If user is admin, show all users
  if (request.session.user.role === "admin") {
    // Check if user is admin
    return response.render("landing", {
      // Admin view
      user: request.session.user, // Include user info
      users: USERS.map(({ password, ...user }) => user), // Exclude passwords
      isAdmin: true, // Flag for admin view
    });
  }

  // Regular user view
  response.render("landing", {
    // Regular user view
    user: request.session.user, // Include user info
    isAdmin: false, // Flag for regular user view
  });
});
app.get("/logout", (request, response) => {
  request.session.destroy();
  response.redirect("/");
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
