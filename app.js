//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require("lodash");
const mongoose = require("mongoose");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Connect to database
mongoose.connect("mongodb://localhost:27017/myBlog", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create Post and Blurb schemas
const postSchema = {
  title: String,
  text: String,
  updated: {
    type: Date,
    default: Date.now
  }
};

const Post = mongoose.model("post", postSchema);

const contentSchema = {
  contentType: String,
  contentText: String
};

const Blurb = mongoose.model('blurb', contentSchema);

// Set default content
const homeDefault = new Blurb({
  contentType: "home",
  contentText: "Edit the home page text to put something here."
});

const aboutDefault = new Blurb({
  contentType: "about",
  contentText: "Edit the About content to put something here."
});

const contactDefault = new Blurb({
  contentType: "contact",
  contentText: "Edit the Contact text to put something here."
});

// If there are no blurbs, create defaults. Else, log a message
Blurb.find({}, function(err, foundBlurbs) {
  if (err) {
    console.log(err);
  } else if (foundBlurbs.length === 0) {
    Blurb.insertMany([homeDefault, aboutDefault, contactDefault]);
  } else {
    console.log("Existing blurbs found.");
  };
});

app.get('/', function(req, res) {
  // finds all posts and sorts in reverse chronological order
  Post.find({}, null, {
    sort: {
      updated: -1
    }
  }, function(err, foundPosts) {
    if (err) {
      console.log(err)
    } else {
      Blurb.findOne({
        contentType: "home"
      }, function(err, foundBlurb) {
        if (err) {
          console.log(err);
        } else {
          res.render('home', {
            postLog: foundPosts,
            homeContent: foundBlurb.contentText
          });
        }
      });
    };
  });
});

app.get('/about', function(req, res) {
    Blurb.findOne({
      contentType: "about"
    }, function(err, foundBlurb) {
      if (err) {
        console.log(err);
      } else {
        res.render('about', {
          aboutContent: foundBlurb.contentText
        });
      };
    });
  }),

  app.get('/contact', function(req, res) {
    Blurb.findOne({
      contentType: "contact"
    }, function(err, foundBlurb) {
      if (err) {
        console.log(err);
      } else {
        res.render('contact', {
          contactContent: foundBlurb.contentText
        });
      };
    });
  }),

  app.get('/compose', function(req, res) {
    res.render('compose')
  });

app.post('/', function(req, res) {
  let post = new Post({
    title: req.body.postTitle,
    text: req.body.postText
  });
  post.save();
  res.redirect('/');
});

// Gets an individual post
app.get('/posts/:postID', function(req, res) {
  Post.findById(req.params.postID, function(err, foundPost) {
    if (err) {
      console.log(err)
    } else {
      res.render('post', {
        postTitle: foundPost.title,
        postText: foundPost.text,
        postDate: foundPost.updated
      });
    };
  });
});

// This version is a callback stack that makes the mongoose queries execute in series.
// It is replaced by using async and await in the GET /EDITS function while calling
// the findContent function, which returns a promise. When the promise is fulfilled,
// the await proceeds to the next step
// app.get('/edits', function(req,res){
//   Blurb.findOne({contentType:'home'}, function(err, foundHome){
//     if (err) {
//       console.log(err);
//     } else {
//       Blurb.findOne({contentType:'about'}, function(err, foundAbout){
//         if (err){
//           console.log(err);
//         } else {
//           Blurb.findOne({contentType:'contact'}, function(err, foundContact){
//             if(err){
//               console.log(err);
//             } else {
//               res.render('edits', {
//                 homeContent:foundHome,
//                 aboutContent:foundAbout,
//                 contactContent:foundContact
//               });
//             };
//           });
//         };
//       });
//     };
//   });
// });

function findContent(cType) {
  return new Promise(function(resolve, reject) {
    Blurb.findOne({
      contentType: cType
    }, function(err, item) {
      if (err) {
        console.log(err);
        reject()
      } else {
        resolve(item)
      };
    });
  });
};

// When the edit page is opened.
// Use async and await with the promises function above
app.get('/edits', async function(req, res) {
  try {
    let foundHome = await findContent("home");
    let foundAbout = await findContent('about');
    let foundContact = await findContent('contact');
    res.render('edits', {
      homeContent: foundHome,
      aboutContent: foundAbout,
      contactContent: foundContact
    });
  } catch (err) {
    console.log(err);
  };
});


// When the editor submits new content
app.post("/Edits", function(req, res) {
  Blurb.findOneAndUpdate({
    contentType: req.body.submit
  }, {
    contentText: req.body.content
  }, {
    useFindAndModify: false
  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/')
    };
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
