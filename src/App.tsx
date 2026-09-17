import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

// App.tsx temporal
/*export default function App() {
  return <h1>Hola mundo</h1>
}*/