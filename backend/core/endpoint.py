# Individual Endpoint definitions of the api we're scanning  
# Probably need more variables, research api specification docs to get all common ones
import hashlib

class Endpoint:
    def __init__(self, path, method, summary, parameters, request_body, responses, tags, description=""):
        self.path = path
        self.method = method
        self.summary = summary
        self.parameters = parameters
        self.request_body = request_body
        self.responses = responses
        self.tags = tags or []
        self.description = description
        self.flags = []

        #id
        unique_str = f"{method}:{path}"
        self.id = hashlib.md5(unique_str.encode()).hexdigest()


    
    #getters and setters for each variable
    def set_value(self):
        print("do something")

    def get_value(self):
        print("do something")

    def add_tag(self, tag):
        if tag and tag not in self.tags:
            self.tags.append(tag)

    def get_tags(self):
        return self.tags

    def add_flag(self, flag):
        if flag and flag not in self.flags:
            self.flags.append(flag)

    def get_flag(self):
        return self.flags