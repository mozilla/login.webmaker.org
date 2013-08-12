/* Add the servicesAccounts column to the login server database */
ALTER TABLE Users ADD COLUMN servicesAccounts VARCHAR(255);
