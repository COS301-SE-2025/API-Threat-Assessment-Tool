# New api
1. User uploads a spec file 
2. Create a new scan manager
    2.0 Note:
            We only interact with the scan manager in the engine
            The scan manager will manage the results and vulnerability tests
    2.1 Scan Manager creates a Vuln scanner using default profile (all owasp 10)
    2.2 Vuln scanner set's flags for endpoint
3. Ask user for api key (Don't store in db, ask for each new section)
4. Allow user to update flags and tags
5. Allow user to start scan using scan manager.
    5.1 This will call run_tests() in the Vuln scanner
    5.2 Returns a scan id once complete
6. Allow user to review results of scan
    6.1 Use get_scan() with the id to view the results of the scan


# Existing api
1. User loads an existing api
2. Allow user to view already set scans and past scans
    2.1 Use get_all_scans() in scan manager to get a json of id:scan_result object
3. Allow user to update or reset flags 
    3.1 Flags are automatically set when a new api is imported
    3.2 The user can can then edit flags as they wish
    3.3 Resetting flags:
        3.3.1 Reset flags for all endpoints
        3.3.2 Reset flags for a particular endpoint by passing in endpoint id (Leaving for next demo, a bit complicated to do rn)
4. Run scan and return results