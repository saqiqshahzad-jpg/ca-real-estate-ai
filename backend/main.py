import os
import json
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

app = FastAPI()
@app.get("/")
def home():
    return {"status": "CA Advisor Server is Running Online! ✅"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🛑 ALAAUDIN BRO: Apni Groq Key yahan dalo
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# --- 📧 EMAIL CONFIGURATION ---
SENDER_EMAIL = "saqiqshahzad@gmail.com" 
APP_PASSWORD = os.environ.get("EMAIL_PASSWORD")

# --- 🗄️ DATABASE SETUP ---
DB_FILE = "users.json"

def load_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump({"users": {}, "otps": {}}, f)
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# --- 📄 PDF CONTEXT ---
PDF_CONTEXT = """
[HOT NOTES



¦ REAL PROPERTY LAW



1. A grant deed transfers title. Do not confuse with a trust deed (financing), which is a security device.
2. A notary public is the party who witnesses the acknowledgment. The
grantor acknowledges by signing in the presence of the notary.
3. To alienate means to transfer (or convey) title.

4. Riparian rights refer to those by a watercourse (river or stream).
5. The three degrees of flood hazard are inundation, sheet overflow, and
ponding. Inundation is the first degree.
6. Stock in a mutual water company is real property.
7. Fee simple is the greatest interest one can have in the land.
8. An estate of inheritance is an estate in fee.
9. Fee simple defeasible is also known as a determinable fee and has conditions of ownership.
10. When a life estate terminates and the interest is to pass to one other than the original grantor, it is known as an estate in remainder. If interest reverts to the original owner, it is an estate in reversion.
11. Less-than-freehold is known as leasehold.
12. An estate for years is a lease agreement (for a definite amount of time).
13. The lessee (tenant) has the covenant of quiet enjoyment and possession, which goes with every lease agreement.
14. A lease for one year or less may be by oral agreement; more than one year must be in writing.



3

4	California Real Estate Exam Guide Sixth Edition


15. A triple-net lease is one wherein the tenant pays a stated rent plus prop- erty taxes, insurance, and maintenance of the property.
16. A percentage lease is usually based on a percentage of the tenant's monthly gross income.
17. A lessee can grant an easement over the property leased, but only for the term of the lease.
18. Rent is consideration paid for the use of the property and is legally due at the end of the term.
19. To sublease is less than an assignment of a lease.
20. The security deposit for an unfurnished residential unit is two months' rent maximum; for furnished, the deposit maximum is three months' rent.
21. The legal action for removal of a defaulting tenant is an unlawful detainer
action.
22. A grant deed must be signed by the grantor, not the grantee.
23. A grant deed requires only an adequate description for its validity.
24. A grant deed is presumed delivered when it is recorded or the grantee has possession of the document; it requires a "granting clause."
25. First to record a grant deed is first in right, with the exception of posses- sion of property.
26. A witnessed will requires three signatures.
27. Customarily, the court confirms a probate sale and sets the broker's commission.
28. An administrator is not a party to a will.
29. Separate property without a will is divided one-third to the surviving spouse and two-thirds to the two or more children.
30. Pur autre vie means "for another's life." This expression is sometimes used in a life estate.
31. The minimum number of days for an eviction is 15. Eviction can occur after the 15th day by court order.
32. Neither an estate for years nor an estate at sufferance requires a notice to terminate.
33. An example of avulsion would be 150 feet of beachfront property being torn away by a flood.
34. The opposite of avulsion is accretion.
35. The opposite of alienation is retention.
36. Be alert to the correct spelling of the term "encumbrance."
37. A lien is a money encumbrance.
38. All liens are encumbrances, but not all encumbrances are liens.
39. A judgment is an example of a general lien.
40. A general lien affects all property of the debtor.

Hot Notes	5


41. Mechanics' liens take priority over all other liens except taxes and spe- cial assessments but are on parity with each other.
42. The date that a mechanic's lien takes is the date the project began because of parity (equal basis).
43. An architect and drayman (truck driver) can file a mechanic's lien if unpaid.
44. When a completion bond is posted, the insurance company has ultimate responsibility for completing the job if the contractor cannot.
45. A Notice of Nonresponsibility is to be recorded and posted by an owner within 10 days of notice of work performed.
46. An attachment is a prejudgment action, is good for three years, and does not terminate on the death of the property owner.
47. A judgment is good for 10 years in the county where it is recorded.
48. A lis pendens action tells of a pending lawsuit affecting the title to land and clouds the title until a final judgment is rendered or until the matter is dismissed or removed.
49. Private restrictions on the use of land are usually created by the origi- nal subdivider but may be created by written agreement or general plan restrictions in subdivisions as well.
50. Covenants, conditions, and restrictions are usually found and recorded on a document called the declaration of restrictions.
51. Violation of a covenant can be stopped by an injunction.
52. Only some covenants "run with the land," whereas all conditions "run with the land."
53. Violation of a condition can bring loss of title (defeasance clause, mean- ing title may be defeated or lost). Courts abhor conditions and often interpret conditions as covenants.
54. If a zoning change of a single lot is being requested, such action is a vari- ance when it is for the owner's benefit.
55. If public restrictions (zoning) and private restrictions (CC&Rs) differ, the more stringent or rigid will prevail.
56. An appurtenant easement goes with the land, whereas an easement in gross goes to a person (e.g., a man gives a woman the right to cross over his property, but the woman does not own any property; she has been given an easement in gross).
57. Typically, a utility company holds an easement in gross to service prop- erty owners.
58. A license allows one to use the property of another but only for the peri- ods or conditions set by owner, and such permission can be revoked by the owner at any time.
59. Easement by prescription establishes use, whereas adverse possession may establish title claim.
60. A spouse can file a homestead declaration on the separate property of the other, if all other requirements are met.

6	California Real Estate Exam Guide Sixth Edition


61. A homestead declaration is effective if recorded before the recording of a judgment.
62. The usual methods for termination of homestead are the sale of property or the filing of a declaration of abandonment.
63. An unlocated easement is valid (e.g., old utility company easements that are difficult to precisely locate).
64. An encroachment is the unlawful intrusion onto the adjacent owner's land (e.g., a fence built over the property line onto a neighbor's lot). The landowner has three years from discovery or encroachment to take action for its removal.
65. A homestead declaration is not an encumbrance.

¦ PROPERTY OWNERSHIP AND LAND USE CONTROLS AND REGULATIONS
1. A grant deed signed by a single person under 18 is void.
2. Commission split agreements between brokers may be by oral agreement. You can pay a commission to an out-of-state broker.
3. Infill redevelops property for mixed use.
4. Executory means something is to be performed at a later date. Executed means a document has been signed.
5. The statute of limitations on a judgment is 10 years.
6. An exclusive agency listing allows the owner to sell the property during the listing period and not pay a commission.
7. All exclusive listings must have a definite termination date.
8. On an open listing, only the agent who is the procuring cause earns the commission.
9. A net listing is legal but not recommended.
10. Expansion and contraction of available spaces is influenced mainly by the elasticity of demand.
11. A kiosk is a small freestanding building used for information purposes, often found in shopping centers.
12. Demography is the study of the population.
13. A megalopolis is a very large city.
14. If a zoning change of a single lot is being requested, such action is a vari- ance when it is for the owner's benefit.
15. Installation of a septic tank must be at least five feet away from the improvements.
16. The term setback describes the distance between the street and the front of the improvements that must remain unimproved to comply with the ordinance. There are front, side, and rear yard setbacks in most communities.
17. The purpose of the Franchise Investment Law is to protect the franchisee.

Hot Notes	7


18. Discretionary funds are used to purchase a franchise.
19. A bulk sales notice must be published by a transferee (a buyer) at least 12 business days before the sale. The notice only has to appear once and is designed to alert the creditors. This is under the Uniform Commercial Code.
20. A buyer should obtain a clearance receipt from the State Board of Equal- ization to avoid successor's liability.
21. A bill of sale transfers title to personal property.
22. A bill of sale requires the seller's signature.
23. The Department of Alcoholic Beverage Control regulates liquor licensing.
24. To be exempt from the permit aspect of the Franchise Investment Law, a franchisor must have a net worth of $5 million with at least 25 franchises operating continuously in the five years preceding the offering.
25. A common test for water pressure is to turn on all faucets and flush the toilets.
26. Toxic waste affects the value of property near a gasoline station.
27. Title VIII of the Civil Rights Act of 1968 (federal) also prohibits dis- crimination in the membership of real estate boards and the multiple listing service. Title VIII is also called the federal Fair Housing Act.
28. "As is" refers to observable defects.
29. Under California fair housing laws, an owner of a single-family residence may take in one boarder to live in the home and is exempt from this act.
30. The Unruh Civil Rights Act controls businesses and prohibits discrimination.
31. Under the Unruh Civil Rights Act, both actual and punitive damages are possible.
32. Steering, panic selling, and blockbusting are examples of illegal and unethi- cal practices by a real estate licensee.
33. Redlining is discrimination by a financial institution.
34. The purpose of federal fair housing laws is to provide fair housing for all persons in the United States.
35. Legal action based on alleged violations of fair housing laws can be brought in both federal and state courts.
36. The landmark U.S. Supreme Court case Jones v. Mayer in 1968 barred racial discrimination in property matters in the United States.
37. As of 1987, a Real Property Transfer Disclosure Statement is required of sellers or transferors of one-unit to four-unit dwellings. Even if seller sells "as is," the statement is still required. A broker cannot fill in seller's por- tion of the form. A broker must make a competent visual inspection of the accessible areas and disclose. This is based on Easton v. Strassburger.
38. A written Agency Disclosure Statement, as of 1988, is required to be given by agents to sellers and buyers of one to four dwelling units.

8	California Real Estate Exam Guide Sixth Edition


39. A fiduciary relationship refers to loyalty, integrity, and utmost care.
40. There are three base and meridian lines in California: Humboldt, Mt. Diablo, and San Bernardino.
41. Do not confuse the term miles square (which means shape) with square miles (which means area or content). For example, a township is a six-mile square, containing 36 square miles. How many townships are there in a 36-mile square? The answer is 36 (36 × 36 = 1,296 ÷ 36 sec- tions to a township = 36).
42. There are 36 sections to a township. Each section contains 640 acres. A section is a one-mile square.
43. The orientation of range lines is north and south (as a memory jogger, there are five letters each in range, north, and south).
44. The orientation of base lines (or township lines) is east and west (there are four letters each in base, east, and west).
45. There are 43,560 square feet to an acre. There are 208.71 feet on each side of a square acre. There are 4,840 square yards to one acre.
46. There are 5,280 feet to a mile.
47. There are 320 rods to a mile, 161/2 feet to one rod, and 4 rods, or 66 feet, to one chain.
48. There are nine square feet to a square yard.
49. A brownfield site is a contaminated abandoned parcel that may be com- plicated to develop.
50. The term side yard setback describes the distance between the property line and the edge of the improvements. Be sure to deduct any side yard setback from both sides.
51. If "setback" dimensions are given in a problem, be sure to deduct the setbacks from the total lot area to arrive at buildable square feet.
52. The term contiguous indicates lots that abut each other, at any point of contact.
53. The metes-and-bounds method of land description is based on angles and directions from a north and south line, used mostly in rural areas.
54. The metes-and-bounds method is the most complex method of land description.
55. The recorded map, lot, block, and tract system is the most commonly used, due to its simplicity.
56. To find the cost of property, add percentage of profit made to 100%, then divide sales price by total percentage.
57. To find sales price, subtract percentage of profit to be made from 100%, then divide the cost by the remainder.
58. The nominal rate stated on any note (financing) is the interest rate stated in the note itself.
59. To change a fraction to a percentage, divide the top number by the bot- tom number and then convert to the percentage form (e.g., ¹/8 = 12.5%).

Hot Notes	9


60. Convert any monthly or quarterly returns on investment to the annual figure before proceeding with calculating the problems.
61. The reciprocal of an 8% capitalization rate is 12.5. This tells us we have to receive our 8% return 12.5 times to equal our initial investment.
62. There are 66 feet to one chain. One hundred chains equal 6,600 feet and is longer than one mile (5,280 feet).
63. Nonconforming use is allowed to continue because it was legal before a zone change, and comes under a grandfather clause.
64. A square parcel of one-half mile by one-half mile describes 160 acres, or a quarter of a section.
65. Avulsion describes a sudden violent action, such as a dam that breaks and washes the land away.
66. Frequent flooding occurs twice in 10 years.
67. An estate has two uses: fee simple and leasehold.
68. Escheat is not a way for an individual to receive title to property. It refers to the way the state might receive title.
69. Eminent domain is a form of involuntary conversion.
70. The county recorder is required to maintain index books.
71. An owner of property cannot be prohibited from placing a For Sale sign on property.
72. Developers are mainly concerned with the purchasing power of the sur- rounding population.
73. Section 7 has 80 acres valued at $500 per acre for a total of $40,000. Section 6 has 40 acres valued at $800 per acre for a total of $32,000. The difference in value of these two sections is $8,000.
74. A parcel that has 3,960 linear feet at its frontage with 1,980 feet on one side and 3,960 feet on the other side because the parcel is bisected by a river contains 270 acres.
75. A mechanic's lien takes priority over all other liens, except taxes and special assessments, such as the 1911 Street Improvement Bond. It also takes priority over a trust deed that is recorded after the mechanic's lien.
76. R-3 zoning is used for three or more units.
77. Flood hazard zones are based on a 100-year history.
78. The footing is the base or bottom of a foundation wall, pier, or column.
79. If the interior side of an exterior wall feels the same as the outside tem- perature, then heat and air are being lost through wall outlets.
80. If the interior side of a partition wall feels the same as the room tempera- ture, then the insulation in the building is sufficient.
81. Wallboard is nailed to studs.
82. If there is no Notice of Completion of work filed (done by the owner of property), then there are 90 days to file a mechanic's lien (remember n-n-n for no, notice, and ninety, making it easy to recall 90 days to file a mechanic's lien when no Notice of Completion is filed).

10	California Real Estate Exam Guide Sixth Edition


83. Police power includes the government's right to enforce land use con- trols, such as zoning, municipal codes, rent control, and subdivision codes, without compensation to property owners. Remember it is emi- nent domain that requires compensation, not police power.
84. A joint tenancy may be severed by conveying it to another party (by sale or gift). The most distinguishing characteristic of joint tenancy is its right of survivorship.
85. The Federal Emergency Management Agency (FEMA) provides maps delineating areas of special flood zones where flooding occurs at least once every 100 years.

¦ PROPERTY VALUATION AND FINANCIAL ANALYSIS
1. An appraisal may be by oral or written means.
2. According to the Uniform Standards of Professional Appraisal Practice (USPAP), members cannot base their fee on a percentage of the final estimate of value and must disclose any interest in the property being appraised.
3. The first step in the appraisal process is to define the problem. The last step is to state the estimated value.
4. Amenity-type properties are single-family residences.
5. The market data or sales comparison approach is used on residential property and vacant land.
6. Land is always appraised separately as if vacant and available for highest and best use.
7. The methods used to appraise land are market data (sales comparison), land residual, development method, or allocation, not equity.
8. Location is the most important factor influencing value.
9. The south and west sides of the street are preferred for retail business.
10. Depth tables are used to appraise vacant lots. The percentage of value is estimated according to the depth of the lot.
11. Orientation refers to the placement of a structure on a lot to gain the best advantage to the elements (wind, sunlight, etc.).
12. A cul-de-sac is a dead-end street.
13. Ad valorem means "according to value."
14. Productivity is a direct function of use.
15. The most often used method for land or site valuation is sales comparison.
16. Economic rent refers to the going market rate for rent of a given unit and is used for the appraisal of income property.
17. Contract rent refers to the actual lease amount of a unit and could be above or below market rate (economic rent).
18. The average economic life of a residence is 40 years.
]
"""

# --- 📦 Pydantic Models ---
class ChatMessage(BaseModel):
    message: str
    email: str 

class AuthRequest(BaseModel):
    email: str
    password: str

class VerifyRequest(BaseModel):
    email: str
    otp: str

# --- 🛠️ HELPER: Send OTP Email ---
def send_otp_email(receiver_email, otp_code):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = receiver_email
        msg['Subject'] = "CA Real Estate AI - Verify Your Account"

        body = f"Hello!\n\nWelcome to CA Real Estate AI. Your secure verification code is: {otp_code}\n\nDo not share this code with anyone."
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

# --- 🚀 API ROUTES ---

@app.post("/signup")
def signup(data: AuthRequest):
    db = load_db()
    if data.email in db["users"] and db["users"][data.email]["verified"]:
        raise HTTPException(status_code=400, detail="User already exists and is verified.")
    
    otp = str(random.randint(100000, 999999))
    db["otps"][data.email] = otp
    db["users"][data.email] = { "password": data.password, "verified": False }
    save_db(db)
    
    if send_otp_email(data.email, otp):
        return {"message": "OTP sent"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP. Check email settings.")

@app.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    db = load_db()
    if data.email not in db["otps"]:
        raise HTTPException(status_code=400, detail="No OTP found for this email.")
    if db["otps"][data.email] == data.otp:
        db["users"][data.email]["verified"] = True
        del db["otps"][data.email]
        save_db(db)
        return {"message": "Account verified!"}
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

@app.post("/login")
def login(data: AuthRequest):
    db = load_db()
    if data.email not in db["users"]:
        raise HTTPException(status_code=400, detail="Account not found. Please sign up.")
    if db["users"][data.email]["password"] != data.password:
        raise HTTPException(status_code=400, detail="Incorrect password.")
    if not db["users"][data.email]["verified"]:
         raise HTTPException(status_code=403, detail="Account not verified. Sign up again for a new OTP.")
    return {"message": "Login successful"}

@app.post("/chat")
def chat(data: ChatMessage):
    # ... (baqi load_db aur auth wala code wahi rahega) ...

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.2, # 🛑 0.2: Taake wo thora samajhdaari se connect kar sake
            messages=[
                {
                    "role": "system", 
                    "content": f"""You are a helpful and professional California Real Estate Advisor.
                    DOCUMENT CONTEXT: {PDF_CONTEXT}
                    
                    RULES:
                    1. If the question is about California Real Estate, Property, Maintenance, or Inspections, ANSWER IT.
                    2. Use the DOCUMENT CONTEXT as your primary source.
                    3. If a question is about property maintenance (like water pressure) that isn't explicitly in the PDF, use your general expertise but remind the user to check specific local California guidelines.
                    4. GREETINGS: Be polite. Answer "Hello" or "How are you" normally.
                    5. STRICT REJECTION: If the user asks about recipes (Biryani), movies, sports, or anything NOT related to real estate/property, say: "I apologize, but I can only assist with Real Estate and Property related inquiries. I cannot help with [Topic Name]."
                    
                    Tone: Professional, helpful, and focused."""
                },
                {"role": "user", "content": data.message},
            ],
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        return {"response": f"System Error: {str(e)}"}