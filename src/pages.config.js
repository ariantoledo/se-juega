/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CreateMatch from './pages/CreateMatch';
import FieldDetail from './pages/FieldDetail';
import FieldOwnerDashboard from './pages/FieldOwnerDashboard';
import Fields from './pages/Fields';
import Home from './pages/Home';
import MatchDetail from './pages/MatchDetail';
import MyMatches from './pages/MyMatches';
import Profile from './pages/Profile';
import Canchas from './pages/Canchas';
import CanchaDetail from './pages/CanchaDetail';
import MisCanchas from './pages/MisCanchas';
import RegistrarEstablecimiento from './pages/RegistrarEstablecimiento';
import RegistrarCancha from './pages/RegistrarCancha';
import GestionarCancha from './pages/GestionarCancha';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateMatch": CreateMatch,
    "FieldDetail": FieldDetail,
    "FieldOwnerDashboard": FieldOwnerDashboard,
    "Fields": Fields,
    "Home": Home,
    "MatchDetail": MatchDetail,
    "MyMatches": MyMatches,
    "Profile": Profile,
    "Canchas": Canchas,
    "CanchaDetail": CanchaDetail,
    "MisCanchas": MisCanchas,
    "RegistrarEstablecimiento": RegistrarEstablecimiento,
    "RegistrarCancha": RegistrarCancha,
    "GestionarCancha": GestionarCancha,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};