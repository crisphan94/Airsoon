import accounts from "../../accounts.json";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const useFilteredAccounts = () => {
  const location = useLocation();
  const [filteredAccounts, setFilteredAccounts] = useState<
    typeof accounts.wallets
  >([]);

  useEffect(() => {
    const currentProject = location.pathname.split("/")[1];
    const validAccounts = accounts.wallets.filter((acc) =>
      acc.projects.includes(currentProject)
    );
    setFilteredAccounts(validAccounts);
  }, [location]);

  return filteredAccounts;
};

export default useFilteredAccounts;
