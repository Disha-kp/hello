import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Layout from './components/Layout';
import FindRide from './pages/FindRide';
import OfferRide from './pages/OfferRide';
import Profile from './pages/Profile';
import Login from './pages/Login';
import RideActive from './pages/RideActive';
import Onboarding from './pages/Onboarding';
import FAQ from './pages/FAQ';
import Settings from './pages/Settings';
import PaymentMethods from './pages/PaymentMethods';
import Safety from './pages/Safety';
import YourRides from './pages/YourRides';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<FindRide />} />
              <Route path="offer" element={<OfferRide />} />
              <Route path="profile" element={<Profile />} />
              <Route path="active-ride/:rideId?" element={<RideActive />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="settings" element={<Settings />} />
              <Route path="payment/:rideId?" element={<PaymentMethods />} />
              <Route path="safety" element={<Safety />} />
              <Route path="your-rides" element={<YourRides />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;
