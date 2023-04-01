const inquirer = require(`inquirer`)
const mysql = require('mysql2');
const cTable = require(`console.table`);

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: `password`,
  database: 'employee_db'
},
console.log(`Connection to employee_db was succesful`));

const viewDept = () => {
    connection.query(`SELECT * FROM department`, (err, data) => {
      err ? console.error(err) : console.table(data);
      mainMenu();
    });
  }
  
const viewRoles = () => {
    connection.query(
      `SELECT role.id, role.title, department.name 
      AS department, role.salary 
      FROM role JOIN department 
      ON role.department_id = department.id 
      ORDER BY role.id`,
      (err, data) => {
        err ? console.error(err) : console.table(data);
        mainMenu();
      }
    );
  }
  
const viewEmployees = () => {
    connection.query(
      `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name 
      AS department, role.salary, 
      IF(employee.manager_id IS NOT NULL, CONCAT(manager.first_name, ' ', manager.last_name), NULL) as manager_name 
      FROM employee JOIN role ON employee.role_id = role.id 
      JOIN department ON department.id = role.department_id 
      LEFT JOIN employee manager ON employee.manager_id = manager.id 
      ORDER BY employee.id;`,
      (err, data) => {
        err ? console.error(err) : console.table(data);
        mainMenu()
      }
    );
  }
  //ADD department function
const addDept = () => {
  // question array for add department inquirer prompt
const addDeptPrompt = [
  {
    message: `What is the Department name: `,
    type: `input`,
    name: `newDept`
  }
]
  inquirer.prompt(addDeptPrompt)
    .then((data) => { 
      console.log(`New Department created by the name: ${data.newDept}`)
      connection.query(`INSERT INTO department (name) VALUES (?)`, data.newDept)
      mainMenu()
    })
    .catch(err => console.error(err));
    
}
// ADD role function
const addRole = () => {
    console.log(`you selected add role`)
    let deptArray = {name:[], id:[]}
    connection.query(`SELECT id, name FROM department`, (err, dataRole) => {
      err ?
       console.error(err) :
       dataRole.forEach( (dept) => { //iterates through ever item in array reurned from mysql query and populates name and id arrays in deptarray object
          deptArray.name.push(dept.name)
          deptArray.id.push(dept.id) } )     
    })
    // question array for add role inquirer prompt
    const rolePrompt = [
    {
      message: `What is the name of the role you would like to add?`,
      type: `input`,
      name: `roleName`,
    },
    {
      message: `What is the salary of the role?`,
      type: `input`,
      name: `roleSalary`,
    },
    {
      message: `What is the department of the role?`,
      type: `list`,
      choices: deptArray.name,
      name: `roleDepartment`,
    }
  ]

      inquirer.prompt(rolePrompt).then((data) => {
        let index = deptArray.name.indexOf(data.roleDepartment) //sql query needs id,  so index of method used to match id with corresponding dept name
        let deptName = deptArray.id[index]
        connection.query(`INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`,
        [data.roleName, data.roleSalary, deptName])
        console.log()
        mainMenu()
      }).catch(err => console.error(err))   
}
//ADD employee function
const addEmployee = () => {
  let empRole = {title:[], id:[]}
  let managers = [`none`]
  let manID = []

  connection.query(`SELECT * FROM role`, (err, roleData) => {
    err?
    console.error(err) :
    roleData.forEach((role) => {
      empRole.title.push(role.title)
      empRole.id.push(role.id)
    })
   })
  connection.query(`SELECT first_name, id FROM employee WHERE manager_id is NULL`, (err, data) => {
    err?
      console.error(err) :
      data.forEach((element) => {
        managers.push(element.first_name)   
        manID.push(element.id)  
    })
  })
  //question array for add employee inquirer prompt
const employeePrompt = [
  {
    message: `Enter first name`,
    type: `input`,
    name: `firstName`,
  },
  {
    message: `Enter last name`,
    type: `input`,
    name: `lastName`,
  },
  {
    message: `Enter role`,
    type: `list`,
    choices: empRole.title,
    name: `employeeRole`,
  },
  {
    message: `Select employee manager`,
    type: `list`,
    choices: managers,
    name: `employeeManager`,
  }
]

inquirer.prompt(employeePrompt).then((data) => {
  let manIndex = managers.indexOf(data.employeeManager)
  let index = empRole.title.indexOf(data.employeeRole)
  if (data.employeeManager !== `none`) {
    connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`,
     [data.firstName, data.lastName, empRole.id[index], manID[manIndex-1]])
    console.log(manID)
  } else {
    connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`,
     [data.firstName, data.lastName, empRole.id[index], null])
  }
  console.log(`${data.firstName} ${data.lastName} has been added as a new emplyee`)
  mainMenu()  

}).catch(err => console.error(err))
    
}
//UPDATE role function
const updateRole = () => {
 let employeeList = {name: [], id: []}
 let roleList = {id:[], title: []}
  connection.query(`SELECT first_name, last_name, id FROM employee`, (err, nameData) => {
    err ?
      console.error(err) :
      nameData.forEach((obj) => {
        employeeList.name.push(`${obj.first_name} ${obj.last_name}`)
        employeeList.id.push(obj.id)
      })
   
  connection.query(`SELECT id, title FROM role`, (err, roleData) => {
    err?
      console.error(err) :
      roleData.forEach((obj)=>{
        roleList.id.push(obj.id)
        roleList.title.push(obj.title)
      })
    })
const updatePrompt = [
  {
    message: `Select employee you want to update`,
    type: `list`,
    name: `updatedEmployee`,
    choices: employeeList.name,
  },
  {
    message: `Select new role for slected employee`,
    type: `list`,
    choices: roleList.title,
    name: `updatedRole`,
  }
]
inquirer.prompt(updatePrompt).then((data) => {
    let empIndex = employeeList.name.indexOf(data.updatedEmployee)
    let idIndex = roleList.title.indexOf(data.updatedRole)
    connection.query(`UPDATE employee SET ? WHERE ?`, [
      { role_id: roleList.id[idIndex] },
      { id: employeeList.id[empIndex]},
    ])

    console.log(`the role of ${data.updatedEmployee} has been updated to ${data.updatedRole}`)
    mainMenu()
  }).catch(err => console.error(err))
})   
}

const exit = () => {
    console.log(`you've exited the application, Good bye!`)
    process.exit()
}

const mainMenu = () => {
  //question array for main menu inquirer prompt
const promptMenu = [
  {
    message: `What would you like to do?`,
    type: `list`,
    choices: [
      `View All Departments`,
      `View All Roles`,
      `View All Employees`,
      `Add Department`,
      `Add Role`,
      `Add Employee`,
      `Update Employee Role`,
      `Exit`,
    ],
    name: 'action'
  },
];

    inquirer.prompt(promptMenu).then((data) => {
      const action = data.action;
      switch (action) {
        case `View All Departments`:
          viewDept();
          break;
        case `View All Roles`:
          viewRoles();
          break;
        case `View All Employees`:
          viewEmployees();
          break;
        case `Add Department`:
          addDept();
          break;
        case `Add Role`:
          addRole();
          break;
        case `Add Employee`:
          addEmployee();
          break;
        case `Update Employee Role`:
          updateRole();
          break;
        case `Exit`:
          exit();
          break;
      }
    }).catch(err => console.error(err));
  }

mainMenu()