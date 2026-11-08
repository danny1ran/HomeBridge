import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AuthProvider, Protected, Loading } from "./lib";
import { Layout } from "./components";
import {
  Home,
  Browse,
  PropertyDetails,
  About,
  Safety,
  NotFound,
} from "./public-pages";
const AuthPage = lazy(() =>
  import("./account-pages").then((m) => ({ default: m.AuthPage })),
);
const Dashboard = lazy(() =>
  import("./account-pages").then((m) => ({ default: m.Dashboard })),
);
const Bookings = lazy(() =>
  import("./account-pages").then((m) => ({ default: m.Bookings })),
);
const Saved = lazy(() =>
  import("./account-pages").then((m) => ({ default: m.Saved })),
);
const ProfileSettings = lazy(() =>
  import("./account-pages").then((m) => ({ default: m.ProfileSettings })),
);
const Listings = lazy(() =>
  import("./landlord-pages").then((m) => ({ default: m.Listings })),
);
const PropertyForm = lazy(() =>
  import("./landlord-pages").then((m) => ({ default: m.PropertyForm })),
);
const Availability = lazy(() =>
  import("./landlord-pages").then((m) => ({ default: m.Availability })),
);
import "./styles.css";
function ScrollReset() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Find your next home",
      "/browse": "Explore student homes",
      "/about": "About HomeBridge",
      "/safety": "Rental safety guide",
      "/login": "Log in",
      "/register": "Create your account",
      "/dashboard": "Your dashboard",
      "/bookings": "Your viewings",
      "/saved": "Saved homes",
      "/profile": "Profile settings",
      "/listings": "Your properties",
      "/listings/new": "Create a listing",
    };
    const title =
      titles[pathname] ||
      (pathname.startsWith("/properties/")
        ? "Property details"
        : pathname.endsWith("/availability")
          ? "Viewing availability"
          : pathname.endsWith("/edit")
            ? "Edit your listing"
            : "Page not found");
    document.title = `${title} · HomeBridge`;
    // Route changes start at the new page, without scrolling through old content.
    // In-page links and the back-to-top control use native smooth scrolling.
    window.scrollTo({ top: 0, behavior: "instant" });
    // Announce route changes to keyboard/screen-reader users, not initial load.
    if (previous.current !== pathname)
      document.getElementById("main")?.focus({ preventScroll: true });
    previous.current = pathname;
  }, [pathname]);
  return null;
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollReset />
        <Layout>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/properties/:id" element={<PropertyDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage register />} />
              <Route
                path="/dashboard"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/bookings"
                element={
                  <Protected>
                    <Bookings />
                  </Protected>
                }
              />
              <Route
                path="/saved"
                element={
                  <Protected role="student">
                    <Saved />
                  </Protected>
                }
              />
              <Route
                path="/profile"
                element={
                  <Protected>
                    <ProfileSettings />
                  </Protected>
                }
              />
              <Route
                path="/listings"
                element={
                  <Protected role="landlord">
                    <Listings />
                  </Protected>
                }
              />
              <Route
                path="/listings/new"
                element={
                  <Protected role="landlord">
                    <PropertyForm />
                  </Protected>
                }
              />
              <Route
                path="/listings/:id/edit"
                element={
                  <Protected role="landlord">
                    <PropertyForm />
                  </Protected>
                }
              />
              <Route
                path="/listings/:id/availability"
                element={
                  <Protected role="landlord">
                    <Availability />
                  </Protected>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
