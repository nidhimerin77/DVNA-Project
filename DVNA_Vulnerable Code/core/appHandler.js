var db = require('../models')
const execFile = require('child_process').execFile;
const net = require('net')
var mathjs = require('mathjs')
var libxmljs = require("libxmljs2");
var serialize = require("node-serialize")
const Op = db.Sequelize.Op

module.exports.userSearch = function (req, res) {
	var login = (req.body.login || '').toString().trim()
	if (!login) {
		req.flash('warning', 'User not found')
		return res.render('app/usersearch', {
			output: null
		})
	}
	db.User.findOne({
		attributes: ['name', 'id'],
		where: {
			login: login
		}
	}).then(user => {
		if (user) {
			var output = {
				user: {
					name: user.name,
					id: user.id
				}
			}
			res.render('app/usersearch', {
				output: output
			})
		} else {
			req.flash('warning', 'User not found')
			res.render('app/usersearch', {
				output: null
			})
		}
	}).catch(err => {
		req.flash('danger', 'Internal Error')
		res.render('app/usersearch', {
			output: null
		})
	})
}

module.exports.ping = function (req, res) {
	var address = (req.body.address || '').toString().trim()
	var hostnamePattern = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/
	if (!address || (net.isIP(address) === 0 && !hostnamePattern.test(address))) {
		return res.render('app/ping', {
			output: 'Invalid address. Enter a valid IP or hostname.'
		})
	}

	var countFlag = process.platform === 'win32' ? '-n' : '-c'
	execFile('ping', [countFlag, '2', address], {
		timeout: 5000,
		windowsHide: true
	}, function (err, stdout, stderr) {
		var output = (stdout || '') + (stderr || '')
		if (err && !output) {
			output = 'Ping failed: ' + err.message
		}
		res.render('app/ping', {
			output: output
		})
	})
}

module.exports.listProducts = function (req, res) {
	db.Product.findAll().then(products => {
		output = {
			products: products
		}
		res.render('app/products', {
			output: output
		})
	})
}

module.exports.productSearch = function (req, res) {
	db.Product.findAll({
		where: {
			name: {
				[Op.like]: '%' + req.body.name + '%'
			}
		}
	}).then(products => {
		output = {
			products: products,
			searchTerm: req.body.name
		}
		res.render('app/products', {
			output: output
		})
	})
}

module.exports.modifyProduct = function (req, res) {
	if (!req.query.id || req.query.id == '') {
		output = {
			product: {}
		}
		res.render('app/modifyproduct', {
			output: output
		})
	} else {
		db.Product.findOne({
			where: {
				'id': req.query.id
			}
		}).then(product => {
			if (!product) {
				product = {}
			}
			output = {
				product: product
			}
			res.render('app/modifyproduct', {
				output: output
			})
		})
	}
}

module.exports.modifyProductSubmit = function (req, res) {
	if (!req.body.id || req.body.id == '') {
		req.body.id = 0
	}
	db.Product.findOne({
		where: {
			'id': req.body.id
		}
	}).then(product => {
		if (!product) {
			product = new db.Product()
		}
		product.code = req.body.code
		product.name = req.body.name
		product.description = req.body.description
		product.tags = req.body.tags
		product.save().then(p => {
			if (p) {
				req.flash('success', 'Product added/modified!')
				res.redirect('/app/products')
			}
		}).catch(err => {
			output = {
				product: product
			}
			req.flash('danger',err)
			res.render('app/modifyproduct', {
				output: output
			})
		})
	})
}

module.exports.userEdit = function (req, res) {
	res.render('app/useredit', {
		userId: req.user.id,
		userEmail: req.user.email,
		userName: req.user.name
	})
}

module.exports.userEditSubmit = function (req, res) {
	var submittedId = (req.body.id || '').toString().trim()
	var currentUserId = req.user.id.toString()

	if (submittedId && submittedId !== currentUserId) {
		req.flash('danger', 'Unauthorized profile update attempt')
		return res.status(403).render('app/useredit', {
			userId: req.user.id,
			userEmail: req.user.email,
			userName: req.user.name,
		})
	}

	db.User.findOne({
		where: {
			'id': req.user.id
		}
	}).then(user => {
		if (!user) {
			req.flash('danger', 'User not found')
			return res.status(404).render('app/useredit', {
				userId: req.user.id,
				userEmail: req.user.email,
				userName: req.user.name,
			})
		}

		var password = (req.body.password || '').toString()
		var cpassword = (req.body.cpassword || '').toString()

		if (password.length > 0) {
			if (password === cpassword) {
				user.password = password
			} else {
				req.flash('warning', 'Passwords dont match')
				return res.render('app/useredit', {
					userId: req.user.id,
					userEmail: req.user.email,
					userName: req.user.name,
				})
			}
		}

		user.email = req.body.email
		user.name = req.body.name

		user.save().then(function () {
			req.flash('success', 'Updated successfully')
			res.render('app/useredit', {
				userId: user.id,
				userEmail: user.email,
				userName: user.name,
			})
		})
	}).catch(() => {
		req.flash('danger', 'Internal Error')
		res.status(500).render('app/useredit', {
			userId: req.user.id,
			userEmail: req.user.email,
			userName: req.user.name,
		})
	})
}

module.exports.redirect = function (req, res) {
	if (req.query.url) {
		res.redirect(req.query.url)
	} else {
		res.send('invalid redirect url')
	}
}

module.exports.calc = function (req, res) {
	if (req.body.eqn) {
		res.render('app/calc', {
			output: mathjs.evaluate(req.body.eqn)
		})
	} else {
		res.render('app/calc', {
			output: 'Enter a valid math string like (3+3)*2'
		})
	}
}

module.exports.listUsersAPI = function (req, res) {
	db.User.findAll({}).then(users => {
		res.status(200).json({
			success: true,
			users: users
		})
	})
}

module.exports.bulkProductsLegacy = function (req,res){
	// TODO: Deprecate this soon
	if(req.files.products){
		var products = serialize.unserialize(req.files.products.data.toString('utf8'))
		products.forEach( function (product) {
			var newProduct = new db.Product()
			newProduct.name = product.name
			newProduct.code = product.code
			newProduct.tags = product.tags
			newProduct.description = product.description
			newProduct.save()
		})
		res.redirect('/app/products')
	}else{
		res.render('app/bulkproducts',{messages:{danger:'Invalid file'},legacy:true})
	}
}

module.exports.bulkProducts =  function(req, res) {
	if (req.files.products && req.files.products.mimetype=='text/xml'){
		var products = libxmljs.parseXmlString(req.files.products.data.toString('utf8'), {noent:true,noblanks:true})
		products.root().childNodes().forEach( product => {
			var newProduct = new db.Product()
			newProduct.name = product.childNodes()[0].text()
			newProduct.code = product.childNodes()[1].text()
			newProduct.tags = product.childNodes()[2].text()
			newProduct.description = product.childNodes()[3].text()
			newProduct.save()
		})
		res.redirect('/app/products')
	}else{
		res.render('app/bulkproducts',{messages:{danger:'Invalid file'},legacy:false})
	}
}
