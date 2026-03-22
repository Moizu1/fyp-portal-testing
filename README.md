# FYP Portal Testing Project

## 📌 Description
This project is a Final Year Project (FYP) Portal system tested using Selenium WebDriver.

The system supports multiple user roles:
- Admin
- Coordinator
- Supervisor
- Internal Examiner
- External Examiner
- Student

## 🛠 Technologies Used
- Frontend: React
- Backend: Node.js / Express
- Database: MongoDB Atlas
- Testing: Selenium WebDriver, Mocha

## 🔐 Test Accounts

| Role | Email | Password |
|------|------|----------|
| Admin | admin@gmail.com | password123 |
| Coordinator | coordinator@gmail.com | password123 |
| Supervisor | supervisor@gmail.com | password123 |
| Internal Examiner | internal@gmail.com | password123 |
| External Examiner | external@gmail.com | password123 |
| Student | student4@gmail.com | password123 |

## 🧪 Test Cases Covered
- Admin Login
- Student Login
- Invalid Login
- Role-based Access Control

## ▶️ How to Run Project

### Backend
cd Backend  
node server.js  

### Frontend
cd fyp  
npm install  
npm run dev  

### Run Selenium Tests
npx mocha tests/login.test.cjs  

## 📊 Features Tested
- Authentication
- Authorization
- Role-based dashboards
- Error handling

## 👨‍💻 Author
Abdul Moiz
