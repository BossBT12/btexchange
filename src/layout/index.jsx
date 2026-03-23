import React from "react";
import MobileHeader from "./header/mobileHeader";
import BottomNavigate from "./footer/bottomNavigate";
import BottomNavigateMlm from "./footer/bottomNavigateMlm";
import { Container } from "@mui/material";

const AppLayout = (props) => {
  const { children, isHeader = false, isBottomNav = false, isMlm = false } = props;

  return (
    <React.Fragment>
      {isHeader && <MobileHeader />}
      <Container
        maxWidth="md"
        disableGutters
        data-app-scroll-container
        sx={{ minHeight: "100vh", overflow: "auto" }}
      >
        {children}
      </Container>
      {isBottomNav && (isMlm ? <BottomNavigateMlm /> : <BottomNavigate />)}
    </React.Fragment>
  )
};

export default AppLayout;
