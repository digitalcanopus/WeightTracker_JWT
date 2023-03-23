import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AddRecordPage from './components/AddRecordPage';
import AuthPage from './components/AuthPage';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import axios from 'axios';
import { Navigate } from 'react-router-dom';

function App() {
  const [records, setRecords] = useState([]);
  const [isLogin, setIsLogin] = useState(false);

  const handleLogin = () => {
    setIsLogin(true);
  };

  const addRecord = record => {
    axios.post('/api/weights', record)
      .then(res => {
        setRecords([...records, res.data]);
      })
      .catch(err => console.log(err));
  };

  const deleteRecord = id => {
    axios.delete(`/api/weights/${id}`)
      .then(res => setRecords(records.filter(record => record._id !== id)))
      .catch(err => console.log(err));
  };

  const register = async (formData) => {
    try {
      const response = await axios.post('/api/users/register', formData);
      console.log('app reg ok'); 
    } catch (error) {
      console.log(error.response.data); 
    }
  }

  const login = async (formData) => {
    try {
      const response = await axios.post('/api/users/login', formData);
      console.log('app log ok');
    } catch (error) {
      console.log(error.response.data);
    }
  }

  return (
    <div className="container">
    <Routes>        
        <Route path="/" element={<HomePage records={records} onDeleteRecord={deleteRecord} />} />
        <Route path="/add" element={<AddRecordPage onAddRecord={addRecord} />} />
        <Route path="/auth" element={<AuthPage onRegister={register} onLogin={login} />} />
        <Route path="/login" element={<LoginForm onLogin={login} handleSwitchToRegister={() => setIsLogin(false)} />} />
        <Route path="/register" element={<RegistrationForm onRegister={register} handleSwitchToLogin={() => setIsLogin(true)} />} />
        <Route path="*" element={<Navigate to='/auth' />} />
    </Routes>
    </div>
  );
}

export default App;