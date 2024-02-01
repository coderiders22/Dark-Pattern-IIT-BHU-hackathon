> You may check the documentation to know more about the problem, approaches, and see ui screenshots.

# Introduction: TrustForge 

> [!OUR PROJECT]
> TrustForge, implements the solution to the problem statement as a set of three branches:
- Using a **Om Browser** which in itself holds the capability to detect dark patterns.
* In addition to this, we also provide an extension, just in case the user still wants to use theri current browser.
+ Also, a key feature of our solution is that the browser supports user privacy by encrypting user data stored as c cookies so that third party apps cannot use this data to target specific dark patterns to the user.
- Each of this gives TrustForge an edge over any other solution you might find in the market, as a browser ensures user friendliness and a holistic solution, an extension ensures flexibility in the solution, and the user privacy feature ensures user trust and data protection.

## Detailed Project Description 

> TrustForge uses a browser that has, by default, capabilities to detect dark patterns and secure user data. 
> The former is achieved by using an inbuilt extension that has been integrated with ML models (BERT) trained to detect such patterns.
> User privacy is often ignored when talking about dark patterns, but in doing so we forget as to why we are tackling dark patterns in the first place. The main goal is user safety, and trustworthy and transparent e commerce transactions.
> So to tackle this, we have another branch of this solution, which is the way the browser ensures user privacy by encrypting user data (stored as cookies) so that any third party cannot access this user data and manipulate it to their use.  
> It is noteworthy that in addition to this browser, we also provide an extension as an alternative solution. The browser holds advantage over the extension in terms of scalability and adaptability. The extension might not be compatible with all browsers, and to solve this, we may have to take away some key features of the solution. 
> That is why instead of coming up with an extension, we have proposed a browser as a solution. 
> Also, this ensures user friendly UI as well as easy accessibility to the solution. User experience is held at high priority, and the browser ensures trustworthy and convenient means to detect dark patterns.

> [!IMPORTANT]
> **Detailed explanation of each factor of the proposed solution**

- Browser
A user-friendly browser, called Om, that has inbuilt dark patterns identification properties. It does so by using an inbuilt extension. The browser will detect these dark patterns and give a warning to the user about the same. 
* Built in extension
Om will have an inbuilt extension that detects and eliminates dark patterns on e-commerce websites. It has been integrated with ML models to detect these patterns. 
+ ML models trained to detect dark patterns 
BERT and NLP models have been integrated with the extension for efficient dark pattern recognition. The models have been trained on relevant data set, and their accuracy, precision, and F1 scores are taken into account before making the decision to use the same. 
- Safeguarding user privacy 
Encryption techniques have been used to safeguard user data and maintain user privacy. User data usually gets stored as cookies on websites, and third party websites use these cookies to their use, by specific targeting users based on their prior interests, and browser history. TrustForge eliminates this entire cycle by encrypting the user data stores as cookies so that any third party cannot manipulate this data to their use. 
* Extension as an alternative solution 
We also provide an extension as an alternate solution. Yet the browser is a better solution in terms of scalability and adaptability, and also in terms of user experience. 

> [!QUESTION]
> Now, a very intuitive question might be that why would you opt for a browser when you could use an extension in your current browser? 

> [!SOLUTION]
> The answer is that by making a browser, we have solved a huge problem that one encounters while using extensions: compatibility. Not all browsers support the same kind of extensions, and it often ends up becoming a hassle for the end user to put to use these extensions with a suitable browser. 
> By giving the user a new browser which by default has capabilities to detect dark patterns, we have not only put user experience to highest priority, but also ensured that we are providing the users with a secure and efficient solution to their problem. 

> [!TECHSTACK]

- Browser
The browser has been made on chromium framework. The built in extension has been integrated with the browser by forking chromium and joining the extension. 
* Extension
The extension has been made in JavaScript. The integration of the model within the extension has been done using Flask.
+ ML model
We used BERT model,  trained it on a relevant dark patterns data set, and deployed it to integrate in the extension. 
- Encryption Techniques
Made using JavaScript, this encryption is compatible with all browsers. The folder has to be uploaded and tapped into to enable it. 


> [!VIII. Flowchart of working](Screenshot.png)

> In conclusion, we have been able to implement a solution that is user friendly, scalable, adaptable, flexible, as well as accurate and secure.


> [!TO VIEW THE OM BROWSER]
>[Click Here](Om.exe)
