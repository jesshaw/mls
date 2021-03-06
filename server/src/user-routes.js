var express = require('express'),
    _ = require('lodash'),
    config = require('./config'),
    jwt = require('jsonwebtoken'),
    User = require('./user');

var app = module.exports = express.Router();

// XXX: This should be a database of users :).
var users = [{
    id: 1,
    username: 'test',
    password: 'test',
    roles: 'student,class1'
}];

function createToken(user) {
    return jwt.sign(_.omit(user, 'password'), config.secret, { expiresInMinutes: 60 * 5 });
}

function getUserScheme(req) {

    var username;
    var type;
    var userSearch = {};

    // The POST contains a username and not an email
    if (req.body.username) {
        username = req.body.username;
        type = 'username';
        userSearch = { username: username };
    }
    // The POST contains an email and not an username
    else if (req.body.email) {
        username = req.body.email;
        type = 'email';
        userSearch = { email: username };
    } else if (req.body.wxname) {
        username = req.body.wxname;
        type = 'wx';
        userSearch = { wxUsername: username };
    }

    return {
        username: username,
        type: type,
        userSearch: userSearch
    };
}

app.post('/users', function(req, res) {

    var userScheme = getUserScheme(req);

    if (!userScheme.username || !req.body.password) {
        return res.status(400).send("You must send the username and the password");
    }

    if (_.find(users, userScheme.userSearch)) {
        return res.status(400).send("A user with that username already exists");
    }

    var profile = _.pick(req.body, userScheme.type, 'password', 'extra');
    profile.id = _.max(users, 'id').id + 1;

    users.push(profile);

    res.status(201).send({
        id_token: createToken(profile)
    });
});
// {wxUsername:"aa"}
// curl -H "Content-Type: application/json" -X POST -d '{"wxname":"test","r":""}' http://localhost:3001/sessions/create
// curl -H "Content-Type: application/json" -X POST -d '{"username":"test","password":"666666"}' http://localhost:3001/sessions/create

app.post('/sessions/create', function(req, res) {

    var userScheme = getUserScheme(req);

    User.findOne(userScheme.userSearch, function(err, user) {
        if (err)
            // return console.error(err);
            return res.send(err);

        if (!user) {
            return res.status(401).send({ message: "The username or password don't match", user: user });
        }

        switch (userScheme.type) {
            case "username":
                if (!userScheme.username || !req.body.password) {
                    return res.status(400).send("You must send the username and the password");
                }

                if (user.password !== req.body.password) {
                    return res.status(401).send("The username or password don't match");
                }
                break;
            case "email":
                return res.status(401).send("The username or password don't match");
            case "wx":
                if (!userScheme.username || !req.body.r) {
                    return res.status(400).send("You must send the wxUsername and the random");
                }

                if (user.wxRandom !== req.body.r) {
                    return res.status(401).send("The username or password don't match");
                }
                break;
            default:
                return res.status(401).send("The username or password don't match");
        }

        res.status(201).send({
            id_token: createToken({
                username: user.username,
                roles: user.roles
            })
        });
    });
});

// curl http://localhost:4001/api/protected/user?username=test
app.get('/api/protected/user', function(req, res) {

    // console.log(req.query);
    if (!req.query.username) {
        return res.status(400).send("You must send the username");
    }
    User.findOne({ username: req.query.username }, function(err, user) {
        if (err)
            return console.error(err);
        res.status(201).send({
            user: user
        });
    });
});

//curl -H "Content-Type: application/json" -X POST -d '{"wxname":"test"}' http://localhost:3001/wx/createRandom

app.post('/wx/createRandom', function(req, res) {

    var userScheme = getUserScheme(req);
    if (!userScheme.username) {
        return res.status(400).send("You must send the username and the password");
    }

    User.findOne(userScheme.userSearch, function(err, user1) {
        if (err) return console.error(err);
        console.dir(user1);
        var user = user1;

        var wxRandom = Math.ceil(Math.random() * 10000000);

        if (!user) {
            user = new User({
                username: userScheme.userSearch.wxUsername,
                password: "666666",
                roles: "student",
                wxUsername: userScheme.userSearch.wxUsername,
                wxRandom: wxRandom,
            });
        } else {
            user.wxRandom = wxRandom;
        }

        user.save(function(err, user) {
            if (err) return console.error(err);
            //console.dir(user);
        });

        res.status(201).send({
            random: wxRandom
        });
    });
});

//curl -H "Content-Type: application/json" -X POST -d '{"username":"test","roles":"student,class2"}' http://localhost:3001/api/protected/user/saveSetting

app.post('/api/protected/user/saveSetting', function(req, res) {


    switch (req.body.type) {
        case 0:
            User.findOne({ _id: req.body.user.id }, function(err, user) {
                if (err)
                    return console.error(err);
                if (user) {
                    user.roles = req.body.user.roles;
                }
                user.save(function(err, user) {
                    if (err)
                        return console.error(err);
                });

                res.status(201).send({
                    id_token: createToken({
                        username: user.username,
                        roles: user.roles
                    })
                });
            });
            break;
        case 1:
            User.findOne({ _id: req.body.user.id }, function(err, user) {
                if (err)
                    return console.error(err);
                if (user) {
                    User.findOne({ username: req.body.user.username }, function(err, sameUser) {

                        if (sameUser) {
                            return res.status(201).send({message:"用户名已被占用，再换换换"});
                        } else {
                            user.username = req.body.user.username;
                            console.log(user);
                            user.save(function(err, user) {
                                if (err)
                                    return console.error(err);
                                res.status(201).send({
                                    id_token: createToken({
                                        username: user.username,
                                        roles: user.roles
                                    })
                                });
                            });
                        }
                    })
                }
                return res.status(201).send({message:"用户不存在"});
            });
            break;
        case 2:
            User.findOne({ _id: req.body.user.id }, function(err, user) {
                if (err)
                    return console.error(err);
                if (user) {
                    if (!req.body.password) {
                        return res.status(400).send("密码不能为空");
                    };
                    if (req.body.password != req.body.confirmPassword) {
                        return res.status(400).send("密码与确认密码不一致");
                    };
                    user.password = req.body.password;
                    user.save(function(err, user) {
                        if (err)
                            return console.error(err);
                        res.status(201).send({
                            id_token: createToken({
                                username: user.username,
                                roles: user.roles
                            })
                        });
                    });
                }
                return res.status(400).send("用户不存在");
            });
            break;
        default:
            return res.status(400).send("用户不存在");
    }
});
