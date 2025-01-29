/*const express = require("express");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { UserModel, IssueModel, connectDB } = require("./config");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set("view engine", "ejs");

// Connect to MongoDB
connectDB()
    .then(() => {
        console.log("MongoDB connected");

        // Routes

        // Homepage route
        app.get("/", (req, res) => {
            res.render("login", { message: "" });
        });

        // Customer signup route
        app.get("/csignup", (req, res) => {
            const message = req.query.message || "";
            res.render("csignup", { message });
        });

        // Technician signup route
        app.get("/tsignup", (req, res) => {
            const message = req.query.message || "";
            res.render("tsignup", { message });
        });

        // Product seller signup route
        app.get("/psignup", (req, res) => {
            const message = req.query.message || "";
            res.render("psignup", { message });
        });

        // Customer signup form submission
        app.post("/csignup", async (req, res) => {
            const existingUser = await UserModel.findOne({ name: req.body.email });
            const data = {
                name: req.body.name,
                password: req.body.password,
                email: req.body.email,
                phone: req.body.phone,
                role: "customer"
            };

            if (existingUser) {
                res.render("csignup", { message: "User Already Exists" });
                return;
            }

            const hashedPassword = await bcrypt.hash(data.password, 10);
            const newUser = new UserModel({ ...data, password: hashedPassword });

            try {
                await newUser.save();
                res.render("login", { message: "Account Created Successfully" });
            } catch (err) {
                res.render("csignup", { message: "Error Creating Account" });
            }
        });

        // Technician signup form submission
        app.post("/tsignup", async (req, res) => {
            try {
                const existingUser = await UserModel.findOne({ name: req.body.email });
                if (existingUser) {
                    return res.redirect("/tsignup?message=Email%20already%20exists.%20Please%20choose%20a%20different%20Email.");
                }
                const data = {
                    email: req.body.email,
                    name: req.body.name,
                    password: req.body.password,
                    phone: req.body.phone,
                    role: "technician",
                    rating: Math.floor(Math.random() * 5) + 1,
                    specialization: req.body.specialization || "General"
                };

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                data.password = hashedPassword;

                await UserModel.create(data);
                res.render("login", { message: "Your account is created." });
            } catch (error) {
                console.error("Error creating technician:", error);
                res.render("tsignup", { message: "Failed to create your account. Please try again." });
            }
        });

        // Product seller signup form submission
        app.post("/psignup", async (req, res) => {
            try {
                const existingUser = await UserModel.findOne({ name: req.body.email });
                if (existingUser) {
                    return res.redirect("/psignup?message=Email%20already%20exists.%20Please%20choose%20a%20different%20Email.");
                }
                const data = {
                    email: req.body.email,
                    name: req.body.name,
                    password: req.body.password,
                    phone: req.body.phone,
                    role: "Product Seller"
                };

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                data.password = hashedPassword;

                await UserModel.create(data);
                res.render("login", { message: "Your account is created." });
            } catch (error) {
                console.error("Error creating product seller:", error);
                res.render("psignup", { message: "Failed to create your account. Please try again." });
            }
        });

        // Login route
        app.post("/login", async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await UserModel.findOne({ email });

                if (!user) {
                    res.render("login", { message: "User not found" });
                } else {
                    const isPasswordMatch = await bcrypt.compare(password, user.password);

                    if (!isPasswordMatch) {
                        res.render("login", { message: "Wrong Password" });
                    } else {
                        req.session.user = user;

                        if (user.role === "customer") {
                            res.redirect("/cs");
                        } else if (user.role === "technician") {
                            res.redirect("/technician");
                        } else if (user.role === "Product Seller") {
                            res.redirect("/ps");
                        }
                    }
                }
            } catch (error) {
                console.error("Error logging in:", error);
                res.render("login", { message: "Error logging in. Please try again later." });
            }
        });

        // Customer dashboard route
        app.get("/cs", async (req, res) => {
            if (!req.session.user || req.session.user.role !== "customer") {
                return res.redirect("/");
            }

            try {
                const technicians = await UserModel.find({ role: 'technician' });
                res.render("cs", { message: "", technicians, user: req.session.user });
            } catch (error) {
                console.error("Error retrieving technicians:", error);
                res.render("cs", { message: "Failed to load technicians. Please try again later.", technicians: [], user: req.session.user });
            }
        });

        // Product seller dashboard route
        app.get("/ps", (req, res) => {
            if (!req.session.user || req.session.user.role !== "Product Seller") {
                return res.redirect("/");
            }
            res.render("ps", { message: "Welcome, Product Seller!", user: req.session.user });
        });

        // Submit issue form submission
        app.post("/submitRequest", async (req, res) => {
            const { name, contactNumber, email, applianceType, brand, issue, date, contactMethod, technician } = req.body;

            try {
                // Validate all required fields
                if (!name || !contactNumber || !email || !applianceType || !brand || !issue || !date || !contactMethod || !technician) {
                    throw new Error("All fields are required.");
                }

                // Create a new issue document
                const newIssue = new IssueModel({
                    name,
                    contactNumber,
                    email,
                    applianceType,
                    brand,
                    issue,
                    date,
                    contactMethod,
                    technician
                });

                // Save the new issue to the database
                await newIssue.save();

                // Fetch updated list of technicians (optional)
                const technicians = await UserModel.find({ role: 'technician' });

                // Render the customer dashboard with a success message and updated technician list
                res.render("cs", { message: "Your issue has been submitted.", technicians, user: req.session.user });

            } catch (error) {
                console.error("Error saving issue:", error.message);

                // Fetch technicians again in case of error (optional)
                const technicians = await UserModel.find({ role: 'technician' });

                // Render the customer dashboard with an error message and technicians list
                res.render("cs", { message: `Failed to submit your issue. ${error.message}`, technicians, user: req.session.user });
            }
        });

        // Technician dashboard route
        app.get("/technician", async (req, res) => {
            if (!req.session.user || req.session.user.role !== "technician") {
                return res.redirect("/");
            }

            try {
                const issues = await IssueModel.find({ technician: req.session.user._id });
                res.render("technician", { issues, message: req.query.message || "", user: req.session.user });
            } catch (error) {
                console.error("Error retrieving issues:", error);
                res.render("technician", { issues: [], message: "Failed to load issues. Please try again later.", user: req.session.user });
            }
        });



         // Product seller dashboard route
        app.get("/ps", async (req, res) => {
            if (!req.session.user || req.session.user.role !== "Product Seller") {
                return res.redirect("/");
            }
            try {
                const orders = await IssueModel.find({}); // Adjust this line to fetch the relevant orders
                res.render("ps", { message: "Welcome, Product Seller!", user: req.session.user, orders });
            } catch (error) {
                console.error("Error retrieving orders:", error);
                res.render("ps", { message: "Failed to load orders. Please try again later.", user: req.session.user, orders: [] });
            }
        });

        // Delete issue route
        app.post("/delete/:id", async (req, res) => {
            const idToDelete = req.params.id;

            try {
                await IssueModel.findByIdAndDelete(idToDelete);
                res.redirect("/technician?message=Issue%20deleted%20successfully");
            } catch (error) {
                console.error("Error deleting issue:", error);
                res.redirect("/technician?message=Failed%20to%20delete%20issue.%20Please%20try%20again.");
            }
        });

        // Logout route
        app.get("/logout", (req, res) => {
            req.session.destroy();
            res.redirect("/");
        });

        // Error handling route
        app.use((req, res) => {
            res.status(404).send("Page Not Found");
        });

        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running http://localhost:${PORT}`);
        });
    })
    .catch((err) => console.error("MongoDB connection error:", err));
*
//NOW

const express = require("express");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { UserModel, IssueModel, connectDB } = require("./config");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set("view engine", "ejs");

// Connect to MongoDB
connectDB()
    .then(() => {
        console.log("MongoDB connected");

        // Routes

        // Homepage route
        app.get("/", (req, res) => {
            res.render("login", { message: "" });
        });

        // Customer signup route
        app.get("/csignup", (req, res) => {
            const message = req.query.message || "";
            res.render("csignup", { message });
        });

        // Technician signup route
        app.get("/tsignup", (req, res) => {
            const message = req.query.message || "";
            res.render("tsignup", { message });
        });

        // Product seller signup route
        app.get("/psignup", (req, res) => {
            const message = req.query.message || "";
            res.render("psignup", { message });
        });

        // Customer signup form submission
        app.post("/csignup", async (req, res) => {
            const existingUser = await UserModel.findOne({ email: req.body.email });
            const data = {
                name: req.body.name,
                password: req.body.password,
                email: req.body.email,
                phone: req.body.phone,
                role: "customer"
            };

            if (existingUser) {
                res.render("csignup", { message: "User Already Exists" });
                return;
            }

            const hashedPassword = await bcrypt.hash(data.password, 10);
            const newUser = new UserModel({ ...data, password: hashedPassword });

            try {
                await newUser.save();
                res.render("login", { message: "Account Created Successfully" });
            } catch (err) {
                res.render("csignup", { message: "Error Creating Account" });
            }
        });

        // Technician signup form submission
        app.post("/tsignup", async (req, res) => {
            try {
                const existingUser = await UserModel.findOne({ email: req.body.email });
                if (existingUser) {
                    return res.redirect("/tsignup?message=Email%20already%20exists.%20Please%20choose%20a%20different%20Email.");
                }
                const data = {
                    email: req.body.email,
                    name: req.body.name,
                    password: req.body.password,
                    phone: req.body.phone,
                    role: "technician",
                    rating: Math.floor(Math.random() * 5) + 1,
                    specialization: req.body.specialization || "General"
                };

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                data.password = hashedPassword;

                await UserModel.create(data);
                res.render("login", { message: "Your account is created." });
            } catch (error) {
                console.error("Error creating technician:", error);
                res.render("tsignup", { message: "Failed to create your account. Please try again." });
            }
        });

        // Product seller signup form submission
        app.post("/psignup", async (req, res) => {
            try {
                const existingUser = await UserModel.findOne({ email: req.body.email });
                if (existingUser) {
                    return res.redirect("/psignup?message=Email%20already%20exists.%20Please%20choose%20a%20different%20Email.");
                }
                const data = {
                    email: req.body.email,
                    name: req.body.name,
                    password: req.body.password,
                    phone: req.body.phone,
                    role: "Product Seller"
                };

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                data.password = hashedPassword;

                await UserModel.create(data);
                res.render("login", { message: "Your account is created." });
            } catch (error) {
                console.error("Error creating product seller:", error);
                res.render("psignup", { message: "Failed to create your account. Please try again." });
            }
        });

        // Login route
        app.post("/login", async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await UserModel.findOne({ email });

                if (!user) {
                    res.render("login", { message: "User not found" });
                } else {
                    const isPasswordMatch = await bcrypt.compare(password, user.password);

                    if (!isPasswordMatch) {
                        res.render("login", { message: "Wrong Password" });
                    } else {
                        req.session.user = user;

                        if (user.role === "customer") {
                            res.redirect("/cs");
                        } else if (user.role === "technician") {
                            res.redirect("/technician");
                        } else if (user.role === "Product Seller") {
                            res.redirect("/ps");
                        }
                    }
                }
            } catch (error) {
                console.error("Error logging in:", error);
                res.render("login", { message: "Error logging in. Please try again later." });
            }
        });

        // Customer dashboard route
        app.get("/cs", async (req, res) => {
            if (!req.session.user || req.session.user.role !== "customer") {
                return res.redirect("/");
            }

            try {
                const technicians = await UserModel.find({ role: 'technician' });
                res.render("cs", { message: "", technicians, user: req.session.user });
            } catch (error) {
                console.error("Error retrieving technicians:", error);
                res.render("cs", { message: "Failed to load technicians. Please try again later.", technicians: [], user: req.session.user });
            }
        });

        // Product seller dashboard route
        app.get("/ps", async (req, res) => {
            if (!req.session.user || req.session.user.role !== "Product Seller") {
                return res.redirect("/");
            }
            try {
                const orders = await IssueModel.find({}); // Adjust this line to fetch the relevant orders
                res.render("ps", { message: "Welcome, Product Seller!", user: req.session.user, orders });
            } catch (error) {
                console.error("Error retrieving orders:", error);
                res.render("ps", { message: "Failed to load orders. Please try again later.", user: req.session.user, orders: [] });
            }
        });

        // Submit issue form submission
        app.post("/submitRequest", async (req, res) => {
            const { name, contactNumber, email, applianceType, brand, issue, date, contactMethod, technician } = req.body;

            try {
                // Validate all required fields
                if (!name || !contactNumber || !email || !applianceType || !brand || !issue || !date || !contactMethod || !technician) {
                    throw new Error("All fields are required.");
                }

                // Create a new issue document
                const newIssue = new IssueModel({
                    name,
                    contactNumber,
                    email,
                    applianceType,
                    brand,
                    issue,
                    date,
                    contactMethod,
                    technician
                });

                // Save the new issue to the database
                await newIssue.save();

                // Fetch updated list of technicians (optional)
                const technicians = await UserModel.find({ role: 'technician' });

                // Render the customer dashboard with a success message and updated technician list
                res.render("cs", { message: "Your issue has been submitted.", technicians, user: req.session.user });

            } catch (error) {
                console.error("Error saving issue:", error.message);

                // Fetch technicians again in case of error (optional)
                const technicians = await UserModel.find({ role: 'technician' });

                // Render the customer dashboard with an error message and technicians list
                res.render("cs", { message: `Failed to submit your issue. ${error.message}`, technicians, user: req.session.user });
            }
        });

        // Technician dashboard route
        app.get("/technician", async (req, res) => {
            if (!req.session.user || req.session.user.role !== "technician") {
                return res.redirect("/");
            }

            try {
                const issues = await IssueModel.find({ technician: req.session.user._id });
                res.render("technician", { issues, message: req.query.message || "", user: req.session.user });
            } catch (error) {
                console.error("Error retrieving issues:", error);
                res.render("technician", { issues: [], message: "Failed to load issues. Please try again later.", user: req.session.user });
            }
        });

        // Delete issue route
        app.post("/delete/:id", async (req, res) => {
            const idToDelete = req.params.id;

            try {
                await IssueModel.findByIdAndDelete(idToDelete);
                res.redirect("/technician?message=Issue%20deleted%20successfully");
            } catch (error) {
                console.error("Error deleting issue:", error);
                res.redirect("/technician?message=Failed%20to%20delete%20issue.%20Please%20try%20again.");
            }
        });

        // Logout route
        app.get("/logout", (req, res) => {
            req.session.destroy();
            res.redirect("/");
        });

        // Error handling route
        app.use((req, res) => {
            res.status(404).send("Page Not Found");
        });

        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running http://localhost:${PORT}`);
        });
    })
    .catch((err) => console.error("MongoDB connection error:", err));*/

    
    const express = require("express");
    const bcrypt = require('bcrypt');
    const session = require('express-session');
    const { UserModel, IssueModel,OrderModel, connectDB } = require("./config");
    
    const app = express();
    
    // Middleware
    app.use(express.json());
    app.use(express.static("public"));
    app.use(express.urlencoded({ extended: false }));
    app.use(session({
        secret: 'yourSecretKey',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }));
    
    app.set("view engine", "ejs");
    
    // Connect to MongoDB
    connectDB()
        .then(() => {
            console.log("MongoDB connected");
    
            // Routes
    
            // Homepage route
            app.get("/", (req, res) => {
                res.render("login", { message: "" });
            });
    
            // Customer signup route
            app.get("/csignup", (req, res) => {
                const message = req.query.message || "";
                res.render("csignup", { message });
            });
    
            // Technician signup route
            app.get("/tsignup", (req, res) => {
                const message = req.query.message || "";
                res.render("tsignup", { message });
            });
    
            // Product seller signup route
            app.get("/psignup", (req, res) => {
                const message = req.query.message || "";
                res.render("psignup", { message });
            });
    
            // Customer signup form submission
            app.post("/csignup", async (req, res) => {
                const existingUser = await UserModel.findOne({ email: req.body.email });
                const data = {
                    name: req.body.name,
                    password: req.body.password,
                    email: req.body.email,
                    phone: req.body.phone,
                    role: "customer"
                };
    
                if (existingUser) {
                    res.render("csignup", { message: "User Already Exists" });
                    return;
                }
    
                const hashedPassword = await bcrypt.hash(data.password, 10);
                const newUser = new UserModel({ ...data, password: hashedPassword });
    
                try {
                    await newUser.save();
                    res.render("login", { message: "Account Created Successfully" });
                } catch (err) {
                    res.render("csignup", { message: "Error Creating Account" });
                }
            });
    
            // Technician signup form submission
            app.post("/tsignup", async (req, res) => {
                try {
                    const existingUser = await UserModel.findOne({ email: req.body.email });
                    if (existingUser) {
                        return res.redirect("/tsignup?message=Email%20already%20exists.%20Please%20choose%20a%20different%20Email.");
                    }
                    const data = {
                        email: req.body.email,
                        name: req.body.name,
                        password: req.body.password,
                        phone: req.body.phone,
                        role: "technician",
                        rating: Math.floor(Math.random() * 5) + 1,
                        specialization: req.body.specialization || "General"
                    };
    
                    const saltRounds = 10;
                    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                    data.password = hashedPassword;
    
                    await UserModel.create(data);
                    res.render("login", { message: "Your account is created." });
                } catch (error) {
                    console.error("Error creating technician:", error);
                    res.render("tsignup", { message: "Failed to create your account. Please try again." });
                }
            });
    
            // Product seller signup form submission
            app.post("/psignup", async (req, res) => {
                try {
                    const existingUser = await UserModel.findOne({ email: req.body.email });
                    if (existingUser) {
                        return res.redirect("/psignup?message=Email%20already%20exists.%20Please%20choose%20a%20different%20Email.");
                    }
                    const data = {
                        email: req.body.email,
                        name: req.body.name,
                        password: req.body.password,
                        phone: req.body.phone,
                        role: "Product Seller"
                    };
    
                    const saltRounds = 10;
                    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                    data.password = hashedPassword;
    
                    await UserModel.create(data);
                    res.render("login", { message: "Your account is created." });
                } catch (error) {
                    console.error("Error creating product seller:", error);
                    res.render("psignup", { message: "Failed to create your account. Please try again." });
                }
            });
    
            // Login route
            app.post("/login", async (req, res) => {
                try {
                    const { email, password } = req.body;
                    const user = await UserModel.findOne({ email });
    
                    if (!user) {
                        res.render("login", { message: "User not found" });
                    } else {
                        const isPasswordMatch = await bcrypt.compare(password, user.password);
    
                        if (!isPasswordMatch) {
                            res.render("login", { message: "Wrong Password" });
                        } else {
                            req.session.user = user;
    
                            if (user.role === "customer") {
                                res.redirect("/cs");
                            } else if (user.role === "technician") {
                                res.redirect("/technician");
                            } else if (user.role === "Product Seller") {
                                res.redirect("/ps");
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error logging in:", error);
                    res.render("login", { message: "Error logging in. Please try again later." });
                }
            });
    
            // Customer dashboard route
            app.get("/cs", async (req, res) => {
                if (!req.session.user || req.session.user.role !== "customer") {
                    return res.redirect("/");
                }
    
                try {
                    const technicians = await UserModel.find({ role: 'technician' });
                    res.render("cs", { message: "", technicians, user: req.session.user });
                } catch (error) {
                    console.error("Error retrieving technicians:", error);
                    res.render("cs", { message: "Failed to load technicians. Please try again later.", technicians: [], user: req.session.user });
                }
            }); // Submit issue form submission
            app.post("/submitRequest", async (req, res) => {
                const { name, contactNumber, email, applianceType, brand, issue, date, contactMethod, technician } = req.body;
    
                try {
                    // Validate all required fields
                    if (!name || !contactNumber || !email || !applianceType || !brand || !issue || !date || !contactMethod || !technician) {
                        throw new Error("All fields are required.");
                    }
    
                    // Create a new issue document
                    const newIssue = new IssueModel({
                        name,
                        contactNumber,
                        email,
                        applianceType,
                        brand,
                        issue,
                        date,
                        contactMethod,
                        technician
                    });
    
                    // Save the new issue to the database
                    await newIssue.save();
    
                    // Fetch updated list of technicians (optional)
                    const technicians = await UserModel.find({ role: 'technician' });
    
                    // Render the customer dashboard with a success message and updated technician list
                    res.render("cs", { message: "Your issue has been submitted.", technicians, user: req.session.user });
    
                } catch (error) {
                    console.error("Error saving issue:", error.message);
    
                    // Fetch technicians again in case of error (optional)
                    const technicians = await UserModel.find({ role: 'technician' });
    
                    // Render the customer dashboard with an error message and technicians list
                    res.render("cs", { message: `Failed to submit your issue. ${error.message}`, technicians, user: req.session.user });
                }
            });
    
            // Product seller dashboard route
            app.get("/ps", async (req, res) => {
                if (!req.session.user || req.session.user.role !== "Product Seller") {
                    return res.redirect("/");
                }
                try {
                    const orders = await OrderModel.find({}); // Adjust this line to fetch the relevant orders
                    res.render("ps", { message: "Welcome, Product Seller!", user: req.session.user, orders });
                } catch (error) {
                    console.error("Error retrieving orders:", error);
                    res.render("ps", { message: "Failed to load orders. Please try again later.", user: req.session.user, orders: [] });
                }
            });
    
            // Technician dashboard route
            app.get("/technician", async (req, res) => {
                if (!req.session.user || req.session.user.role !== "technician") {
                    return res.redirect("/");
                }
    
                try {
                    const issues = await IssueModel.find({ technician: req.session.user._id });
                    const sellers = await UserModel.find({ role: "Product Seller" }); // Fetch sellers
    
                    res.render("technician", { issues, sellers, message: req.query.message || "", user: req.session.user });
                } catch (error) {
                    console.error("Error retrieving issues:", error);
                    res.render("technician", { issues: [], sellers: [], message: "Failed to load issues. Please try again later.", user: req.session.user });
                }
            });
             app.post('/technician/order', async (req, res) => {
            const { name, contactNumber, partsname, quantity, date } = req.body;

            try {
                // Create a new order request
                const newOrderRequest = await OrderModel.create({
                    name,
                    contactNumber,
                    partsname,
                    quantity,
                    date
                    // Assuming you have user session and 'technician' is stored in req.session.user._id
                });

                console.log('New order request created:', newOrderRequest);
                res.redirect('/technician?message=Order%20request%20submitted%20successfully');
            } catch (error) {
                console.error('Error submitting order request:', error);
                res.redirect('/technician?message=Failed%20to%20submit%20order%20request.%20Please%20try%20again.');
            }
        });
        // Technician order submission route
app.post('/technician/order', async (req, res) => {
    const { name, contactNumber, partsname, quantity, date } = req.body;

    try {
        // Validate all required fields
        if (!name || !contactNumber || !partsname || !quantity || !date) {
            throw new Error("All fields are required.");
        }

        // Create a new order request
        const newOrderRequest = await OrderModel.create({
            name,
            contactNumber,
            partsname,
            quantity,
            date
            // Assuming you have user session and 'technician' is stored in req.session.user._id
        });

        console.log('New order request created:', newOrderRequest);
        res.redirect('/technician?message=Order%20request%20submitted%20successfully');
    } catch (error) {
        console.error('Error submitting order request:', error);
        res.redirect('/technician?message=Failed%20to%20submit%20order%20request.%20Please%20try%20again.');
    }
});

            
    
            // Delete issue route
            app.post("/delete/:id", async (req, res) => {
                const idToDelete = req.params.id;
    
                try {
                    await IssueModel.findByIdAndDelete(idToDelete);
                    res.redirect("/technician?message=Issue%20deleted%20successfully");
                } catch (error) {
                    console.error("Error deleting issue:", error);
                    res.redirect("/technician?message=Failed%20to%20delete%20issue.%20Please%20try%20again.");
                }
            });

            
        // Delete order route
          // Delete order route
app.post("/delete/:id", async (req, res) => {
    const idToDelete = req.params.id;
    console.log(`Attempting to delete order with ID: ${idToDelete}`);

    try {
        const deletedOrder = await OrderModel.findByIdAndDelete(idToDelete);
        if (deletedOrder) {
            console.log(`Order with ID: ${idToDelete} deleted successfully`);
            res.redirect("/ps?message=Order%20deleted%20successfully");
        } else {
            console.log(`No order found with ID: ${idToDelete}`);
            res.redirect("/ps?message=Order%20not%20found");
        }
    } catch (error) {
        console.error("Error deleting order:", error);
        res.redirect("/ps?message=Failed%20to%20delete%20order.%20Please%20try%20again.");
    }
});

            
    
            // Logout route
            app.get("/logout", (req, res) => {
                req.session.destroy();
                res.redirect("/");
            });
    
            // Error handling route
            app.use((req, res) => {
                res.status(404).send("Page Not Found");
            });
    
            // Start server
            const PORT = process.env.PORT || 5000;
            app.listen(PORT, () => {
                console.log(`Server running http://localhost:${PORT}`);
            });
        })
        .catch((err) => console.error("MongoDB connection error:", err));
    


        