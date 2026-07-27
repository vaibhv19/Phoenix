import React from 'react'
import { useAuthStore } from './store/useAuthStore'
import { useProjectStore } from './store/useProjectStore'
import AuthForm from './components/AuthForm'
import Layout from './components/Layout'
import ChatContainer from './components/Chat/ChatContainer'
import VaultDashboard from './components/Vault/VaultDashboard'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { activeView } = useProjectStore()

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return (
    <Layout>
      {activeView === 'chat' && <ChatContainer />}
      {activeView === 'vault' && <VaultDashboard />}
    </Layout>
  )
}

export default App
