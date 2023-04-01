INSERT INTO department (name)
VALUES
    ("HR"),
    ("Sales"),
    ("Engineering");

INSERT INTO role (title, salary, department_id)
VALUES 
    ("Sr. Developer", 150000, 1), 
    ("Sales Rep", 54300, 2), 
    ("HR Rep", 73500, 3);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
    ("Zoro", "Ronoroa", 3, 3),
    ("Chopper", "Tony", 2, 3),
    ("Monkey", "Luffy", 1, NULL);