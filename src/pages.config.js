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
import { lazy } from 'react';

const CanchaDetail = lazy(() => import('./pages/CanchaDetail'));
const Canchas = lazy(() => import('./pages/Canchas'));
const ConfigurarStripe = lazy(() => import('./pages/ConfigurarStripe'));
const CreateMatch = lazy(() => import('./pages/CreateMatch'));
const EditarEstablecimiento = lazy(() => import('./pages/EditarEstablecimiento'));
const FieldDetail = lazy(() => import('./pages/FieldDetail'));
const FieldOwnerDashboard = lazy(() => import('./pages/FieldOwnerDashboard'));
const Fields = lazy(() => import('./pages/Fields'));
const GestionarCancha = lazy(() => import('./pages/GestionarCancha'));
const Home = lazy(() => import('./pages/Home'));
const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const MisCanchas = lazy(() => import('./pages/MisCanchas'));
const MyMatches = lazy(() => import('./pages/MyMatches'));
const Profile = lazy(() => import('./pages/Profile'));
const RegistrarCancha = lazy(() => import('./pages/RegistrarCancha'));
const RegistrarEstablecimiento = lazy(() => import('./pages/RegistrarEstablecimiento'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "CanchaDetail": CanchaDetail,
    "Canchas": Canchas,
    "ConfigurarStripe": ConfigurarStripe,
    "CreateMatch": CreateMatch,
    "EditarEstablecimiento": EditarEstablecimiento,
    "FieldDetail": FieldDetail,
    "FieldOwnerDashboard": FieldOwnerDashboard,
    "Fields": Fields,
    "GestionarCancha": GestionarCancha,
    "Home": Home,
    "MatchDetail": MatchDetail,
    "MisCanchas": MisCanchas,
    "MyMatches": MyMatches,
    "Profile": Profile,
    "RegistrarCancha": RegistrarCancha,
    "RegistrarEstablecimiento": RegistrarEstablecimiento,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};