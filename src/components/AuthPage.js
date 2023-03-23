import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      setIsModalOpen(true);
      return;
    }
    const formData = {
      username,
      password,
    };
    const apiEndpoint = isLogin ? '/api/users/login' : '/api/users/register';
    try {
      const response = await axios.post(apiEndpoint, formData);
      console.log('auth ok'); //OK

      setIsLogin(!isLogin);
      navigate('/');
    } catch (error) {
      console.log(error.response.data);
    }
  };

  const handleSubmitR = async (event) => {
    event.preventDefault();
    const formData = {
      username,
      password,
    };
    try {
      const response = await axios.post('/api/users/register', formData);
      console.log('registration successful'); //OK
      console.log(response.headers);

      const cookies = document.cookie;
      localStorage.setItem('cookies', cookies);
      setUsername('');
      setPassword('');
      setIsLogin(!isLogin);
    } catch (error) {
      console.log(error.response.data);
    }
  };

  const handleSubmitL = async (event) => {
    event.preventDefault();
    const formData = {
      username,
      password,
    };
    try {
      const response = await axios.post('/api/users/login', formData);
      console.log('login successful'); //OK
      navigate('/');
    } catch (error) {
      console.log(error.response.data);
    }
  };

  const handleSwitch = () => {
    setIsLogin(!isLogin);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h2 className="h2">{isLogin ? 'Login' : 'Register'}</h2>
        {isLogin ? (
          <LoginForm
            formData={{ username, password }}
            handleChange={(event) =>
              event.target.name === 'username'
                ? setUsername(event.target.value)
                : setPassword(event.target.value)
            }
            handleSubmit={handleSubmitL}
            handleSwitchToRegister={handleSwitch}
          />
        ) : (
          <RegistrationForm
            formData={{ username, password }}
            handleChange={(event) =>
              event.target.name === 'username'
                ? setUsername(event.target.value)
                : setPassword(event.target.value)
            }
            handleSubmit={handleSubmitR}
            handleSwitchToLogin={handleSwitch}
          />
        )}
      </div>
      <Modal isOpen={isModalOpen} onRequestClose={closeModal}>
        <h2>Please fill in all fields</h2>
        <button onClick={closeModal}>Close</button>
      </Modal>
    </form>
  );
};

export default AuthPage;