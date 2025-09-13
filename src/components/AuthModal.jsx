import { useState } from 'react'
import Login from './Login'
import Signup from './Signup'

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  return (
    <>
      {isLogin ? (
        <Login 
          onClose={onClose} 
          onSwitchToSignup={() => setIsLogin(false)} 
        />
      ) : (
        <Signup 
          onClose={onClose} 
          onSwitchToLogin={() => setIsLogin(true)} 
        />
      )}
    </>
  )
}

export default AuthModal
