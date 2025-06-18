# tldr (open this in edit to view properly)
Import api from some spec file
-> Use APIImport.import()
-> APIClient object is created, Sets relevant information about API based of file contents.
-> Each endpoint found in the file is used to create an Endpoint object.
-> Information about each endpoint stored in the Endpoint object.
-> APIClient has an array/list of Endpoint objects.
-> Return APIClient. 

Running a Scan
-> Use the ScanManager from main to create new scan profiles/types.
-> Scan Manager should:
-> Make a new VulnerabilityScanner Object which takes in an APIClient.
    -> Each VulnerabilityScanner object should represent a differnt type of scan profile.
-> Add VulnerabilityTest objects to the VulnerabilityScanner to set up approprate tests (Can use factories to set up VulnerabilityScanner's?)
-> Use the VulnerabilityScanner.runTests() function.
    -> This iterates through each VulnerabilityTest and uses VulnerabilityTest.runTest().
    -> runTest() in VulnerabilityTest:
        -> This will go over the Endpoints array from the APIClient.
        -> Find relevant Endpoints and store them.
        -> After storing it starts pulling infomation from the endpoints.
            ->NB: We should only pull information from the endpoint object and maybe update the tags, but nothing else.
        -> For each endpoint create a new HTTPInterface object.
            -> Set this up using infomation from the APIClient and Endpoint object.
            -> Update the Headers & Body of HTTPInterface as needed.
            -> Use HTTPInterface.send_X() function on the endpoint.
            -> Create a ScanResult Object for each endpoint based on response.
        -> return array of ScanResult Objects to the VulnerabilityScanner.
        -> VulnerabilityScanner then stores these results using the ResultManager.

Result Manager
-> Each result is a array of ScanResult's
-> This is stored in a dictionary, still need to decide on what key value to use


Generating a report
-> Use the ReportGenerator
-> Takes in a ScanResult object from the ResultManager (ResultManager could become a memento maybe)
-> Converts this to a format / object defined in vulnerability_report
-> Do black magic and spit out a report in a format defined in "vulnerability_report.py"
