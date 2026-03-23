import { useContext } from "react";
import SnackbarContext from "../features/snackBar";

const useSnackbar = () => useContext(SnackbarContext);

export default useSnackbar;
