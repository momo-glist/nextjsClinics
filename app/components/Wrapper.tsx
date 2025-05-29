import React from "react";
import { ToastContainer } from "react-toastify";
import Sidebar from "./Sidebar";

type WrapperProps = {
  children: React.ReactNode;
};

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Bouton menu visible uniquement sur mobile */}
        <div className="w-full navbar bg-base-100 lg:hidden px-4 shadow-md">
          <label htmlFor="my-drawer" className="btn btn-ghost">
            ☰ Menu
          </label>
        </div>

        {/* Contenu principal */}
        <div className="px-4 sm:px-6 md:px-6 lg:px-8 mt-4 mb-10">
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
            draggable
          />
          {children}
        </div>
      </div>

      {/* Sidebar : drawer-side */}
      <div className="drawer-side bg-transparent backdrop-blur-md">
        <label
          htmlFor="my-drawer"
          className="drawer-overlay bg-transparent"
        ></label>
        <Sidebar />
      </div>
    </div>
  );
};

export default Wrapper;
