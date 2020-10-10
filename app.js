const mysql = require("mysql2")
const express = require('express')  
const bcrypt = require('bcryptjs')


const app = express() 

const jsonParser = express.json()


app.use(express.static(__dirname+'/client/public'))
app.use(express.json({extended: true}))

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "mySQL",
  password: "stanislav010101"
});
 connection.connect(function(err){
    if (err) {
      return console.error("Ошибка: " + err.message);
    }
    else {
          app.listen(5000, function() {
          connection.query("USE cosmetics")
          console.log("Server is waiting...");
         })
    }
 });

 app.get("/dataInTable/:tableName", jsonParser, function(request,result) {
  connection.query("USE cosmetics")
  let tableName = request.params.tableName
  connection.query(`select * from ${tableName}`, function(err,res){
    let arr = []
    for(key in res) {
      table = res[key]
      arr.push(table)  
    }
    result.send(arr)
  })
})


app.get("/productInTable/:productName", jsonParser, function(request, result) {
  connection.query("USE cosmetics")
  let productName = request.params.productName
  connection.query(
    // `SELECT * FROM categories JOIN product WHERE product.Title="${productName}"`
      `SELECT product.id, product.Title, product.Description, product.Volume, product.Price, 
      categories.CategoriesTitle, subcategories.SubcategoriesTitle, brands.BrandsTitle, brands.id
      FROM product
      JOIN categories
        ON product.Categories_id = categories.id
      JOIN subcategories 
        ON product.Subcategories_id = subcategories.id
      JOIN brands 
        ON product.Brands_id = brands.id
      WHERE product.Title="${productName}"`, 
      function(err, res){
          let arr = []
          for(key in res) {
            table = res[key]
            arr.push(table)
          }
          result.send(arr)
        })
})

app.get("/users", jsonParser, function(req,result) {
      connection.query("USE mydb")
      connection.query("SHOW TABLES", function(err, res){
      let arr = []
      let id = 1
      for(key in res) {
        table = {
          id: id,
          title: res[key].Tables_in_mydb
        } 
        arr.push(table)
        id++
      }
      result.send(arr)
    })
})

app.post("/addStr", jsonParser, function(request, result) {
  connection.query("USE cosmetics")
  const json = request.body
  const tableName = json.tableName
  delete json.tableName
  const keys = Object.keys(json)
  connection.query(
    `
    INSERT INTO ${tableName}
    (${keys.map(key => key)})
    VALUES (${keys.map(key=>{
      if(key != "tableName")
        return (
          json[key]
        )
    })});
    `
  )
  console.log("Success")
})

app.post("/deleteStr", jsonParser, function(request, result) {
  connection.query("USE cosmetics")
  const json = request.body
  const key = Object.keys(json)
  connection.query(`
    DELETE FROM ${json[key[0]]}
    WHERE ${[key[1]]} = ${json[key[1]]}
  `)
  console.log("Success")
})



// async function Office() {
//   const json = {
//     login: 'ivanov',
//     email: "ivanov@mail.ru",
//     password: "qwerty"
//   }
//   password = json.password
//   const hashedPassword = await bcrypt.hash(password, 8)
//   console.log(hashedPassword)
//   connection.query("USE cosmetics")
//   connection.query(
//     `INSERT INTO private_office
//      VALUES ("Petrov", "${hashedPassword}", "petrov@mail.ru", 1)`)
//   console.log("Office is work rigth!")
// }
// Office()

// async function Office() {
//   let userLogin = "Ivanov"
//   connection.query("USE cosmetics")
  // connection.query(`
  //   SELECT * from customers
  //   JOIN private_office
  //   ON customers.id = private_office.Customers_id
  //   WHERE private_office.Login = "${userLogin}"
  //   `, function(err, res) {
  //     console.log(res)
  //   })
// }
// Office()

app.post("/dataInUser", jsonParser, function(request, result) {
  connection.query("USE cosmetics")
  const User = request.body
  const login = User.login
  const password = User.password
  connection.query(`select * from private_office
     where private_office.Login = "${User.login}"
    `, 
    function(err, res){
      try {
         res = res[0]
          if(bcrypt.compareSync(User.password, res.Password)) {
          connection.query(`
            SELECT * from customers
            JOIN private_office
            ON customers.id = private_office.Customers_id
            WHERE private_office.Login = "${User.login}"`, 
            function(err, res) {
              connection.query(`
                SELECT * from customers
                JOIN private_office
                ON customers.id = private_office.Customers_id
                WHERE private_office.Login = "${User.login}"`, function(err, res) {
                  res.push({message: 'Success'})
                  result.send(res)
                })
          })} 
          else result.status(500).json([{message: 'Error!'}])
      } catch(err) {
        result.status(500).json([{message: 'Error!'}])
      }
  })  
})

app.post('/addNewUser', jsonParser, function(request, result){
  connection.query("USE cosmetics")
  const User = request.body
  const hashedPassword = bcrypt.hashSync(User.Password, 8)
  const id = randomInteger(1,100000);
  connection.query(`
    INSERT INTO customers (customers.id, customers.Name, customers.SurName, customers.Gender, customers.Age, customers.Phone) 
    VALUES (${id}, "${User.FirstName}", "${User.LastName}", "${User.Gender}", "${User.Age}", ${User.Phone})`,
    function(err, res) {
      connection.query(`
        INSERT INTO private_office (private_office.Login, private_office.Password, private_office.Email, private_office.Customers_id)
        VALUES ("${User.Login}", "${hashedPassword}", "${User.Email}", ${id})
      `)
      console.log("Success!")
    })
  console.log("Create new User")
})

function randomInteger(min, max) {
  // получить случайное число от (min-0.5) до (max+0.5)
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}



