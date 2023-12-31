const express = require("express");
const { User, Course } = require("../db");
const {
  USERSECRET,
  generateJWT,
  authenticateJWTUser,
} = require("../middleware/auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user) {
    res.status(403).json({ message: "User already exists" });
  } else {
    const newUser = new User({ username, password });
    await newUser.save();
    const token = generateJWT({ username, role: "user" }, USERSECRET);
    res.json({ message: "User created successfully", token });
  }
});

router.post("/login", async (req, res) => {
  // logic to log in user
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (user) {
    const token = generateJWT({ username, role: "user" }, USERSECRET);
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(401).json({ message: "User login failed" });
  }
});

router.get("/me", authenticateJWTUser, (req, res) => {
  res.json({ username: req.user.username });
});

router.get("/courses", authenticateJWTUser, async (req, res) => {
  // logic to list all courses
  const courses = await Course.find({ published: true });
  res.json({ courses });
});

router.get("/courses/:courseId", authenticateJWTUser, async (req, res) => {
  // logic to get a course
  const course = await Course.findOne({
    _id: req.params.courseId,
    published: true,
  });

  if (course) {
    res.json({ course });
  } else {
    res.status(404).json({ message: "Course does not exist." });
  }
});

router.post("/courses/:courseId", authenticateJWTUser, async (req, res) => {
  // logic to purchase a course
  try {
    const course = await Course.findById(req.params.courseId);
    const user = await User.findOne({ username: req.user.username });
    const existingCourse = user.purchasedCourses.find((c) => {
      return c.toString() === String(course._id);
    });

    if (!existingCourse) {
      user.purchasedCourses.push(course);
      await user.save();
      res.json({ message: "Course purchased successfully" });
    } else {
      res
        .status(404)
        .json({ message: "You have already purchased this course" });
    }
  } catch {
    res.status(404).json({ message: "Course not exists" });
  }
});

router.get("/purchasedCourses", authenticateJWTUser, async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({ username: req.user.username }).populate(
    "purchasedCourses"
  );

  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses });
  } else {
    res.status(404).json({ message: "User does not exist" });
  }
});

module.exports = router;
