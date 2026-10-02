export interface VillageInfo {
  name: string;
  pincode: string;
  officeName?: string;
  officeType?: string;
}

export interface SubDistrictInfo {
  name: string;
  villages: VillageInfo[];
}

export interface DistrictInfo {
  name: string;
  subDistricts: SubDistrictInfo[];
}

export interface StateInfo {
  name: string;
  code: string;
  districts: DistrictInfo[];
}

export const INDIA_PINCODE_DATA: StateInfo[] = [
  {
    name: 'Maharashtra',
    code: 'MH',
    districts: [
      {
        name: 'Mumbai City & Suburban',
        subDistricts: [
          {
            name: 'Mumbai South',
            villages: [
              { name: 'Fort / GPO', pincode: '400001', officeName: 'Mumbai G.P.O.' },
              { name: 'Colaba', pincode: '400005', officeName: 'Colaba S.O' },
              { name: 'Nariman Point', pincode: '400021', officeName: 'Nariman Point S.O' },
              { name: 'Marine Lines', pincode: '400020', officeName: 'Marine Lines S.O' },
              { name: 'Girgaon', pincode: '400004', officeName: 'Girgaon S.O' },
              { name: 'Byculla', pincode: '400027', officeName: 'Byculla S.O' },
              { name: 'Worli', pincode: '400018', officeName: 'Worli S.O' },
              { name: 'Dadar West', pincode: '400028', officeName: 'Dadar H.O' },
            ],
          },
          {
            name: 'Mumbai Western Suburbs',
            villages: [
              { name: 'Bandra West', pincode: '400050', officeName: 'Bandra West S.O' },
              { name: 'Khar West', pincode: '400052', officeName: 'Khar West S.O' },
              { name: 'Santacruz West', pincode: '400054', officeName: 'Santacruz West S.O' },
              { name: 'Vile Parle East', pincode: '400057', officeName: 'Vileparle East S.O' },
              { name: 'Andheri West', pincode: '400053', officeName: 'Andheri West S.O' },
              { name: 'Andheri East', pincode: '400069', officeName: 'Andheri East S.O' },
              { name: 'Juhu', pincode: '400049', officeName: 'Juhu S.O' },
              { name: 'Goregaon West', pincode: '400104', officeName: 'Goregaon West S.O' },
              { name: 'Malad West', pincode: '400064', officeName: 'Malad West S.O' },
              { name: 'Kandivali West', pincode: '400067', officeName: 'Kandivali West S.O' },
              { name: 'Borivali West', pincode: '400092', officeName: 'Borivali West S.O' },
            ],
          },
          {
            name: 'Mumbai Eastern Suburbs',
            villages: [
              { name: 'Kurla West', pincode: '400070', officeName: 'Kurla West S.O' },
              { name: 'Ghatkopar East', pincode: '400077', officeName: 'Ghatkopar East S.O' },
              { name: 'Powai (IIT Bombay)', pincode: '400076', officeName: 'IIT Powai S.O' },
              { name: 'Chembur', pincode: '400071', officeName: 'Chembur H.O' },
              { name: 'Bhandup West', pincode: '400078', officeName: 'Bhandup West S.O' },
              { name: 'Mulund West', pincode: '400080', officeName: 'Mulund West S.O' },
            ],
          },
        ],
      },
      {
        name: 'Pune',
        subDistricts: [
          {
            name: 'Haveli (Pune Urban)',
            villages: [
              { name: 'Shivajinagar', pincode: '411005', officeName: 'Shivajinagar H.O' },
              { name: 'Kothrud', pincode: '411038', officeName: 'Kothrud S.O' },
              { name: 'Aundh', pincode: '411007', officeName: 'Aundh S.O' },
              { name: 'Baner', pincode: '411045', officeName: 'Baner S.O' },
              { name: 'Hinjewadi (IT Park)', pincode: '411057', officeName: 'Infotech Park Hinjawadi S.O' },
              { name: 'Hadapsar / Magarpatta', pincode: '411028', officeName: 'Hadapsar S.O' },
              { name: 'Viman Nagar', pincode: '411014', officeName: 'Viman Nagar S.O' },
              { name: 'Wakad', pincode: '411057', officeName: 'Wakad B.O' },
              { name: 'Kalyani Nagar', pincode: '411006', officeName: 'Yerwada S.O' },
            ],
          },
          {
            name: 'Baramati',
            villages: [
              { name: 'Baramati Town', pincode: '413102', officeName: 'Baramati H.O' },
              { name: 'Malegaon Budruk', pincode: '413115', officeName: 'Malegaon B.K. S.O' },
              { name: 'Deulgaon Rasal', pincode: '413130', officeName: 'Deulgaon Rasal B.O' },
            ],
          },
          {
            name: 'Maval',
            villages: [
              { name: 'Lonavala', pincode: '410401', officeName: 'Lonavala H.O' },
              { name: 'Khandala', pincode: '410301', officeName: 'Khandala S.O' },
              { name: 'Talegaon Dabhade', pincode: '410506', officeName: 'Talegaon Dabhade S.O' },
            ],
          },
        ],
      },
      {
        name: 'Thane',
        subDistricts: [
          {
            name: 'Thane',
            villages: [
              { name: 'Thane West Head Office', pincode: '400601', officeName: 'Thane H.O' },
              { name: 'Naupada', pincode: '400602', officeName: 'Naupada S.O' },
              { name: 'Wagle Estate', pincode: '400604', officeName: 'Wagle I.E. S.O' },
              { name: 'Ghodbunder Road / Kasarvadavali', pincode: '400615', officeName: 'Kasarvadavali S.O' },
            ],
          },
          {
            name: 'Kalyan',
            villages: [
              { name: 'Kalyan City', pincode: '421301', officeName: 'Kalyan City S.O' },
              { name: 'Dombivli East', pincode: '421201', officeName: 'Dombivli S.O' },
              { name: 'Dombivli West', pincode: '421202', officeName: 'Dombivli West S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Delhi',
    code: 'DL',
    districts: [
      {
        name: 'Central Delhi',
        subDistricts: [
          {
            name: 'Kotwali',
            villages: [
              { name: 'Chandni Chowk', pincode: '110006', officeName: 'Chandni Chowk H.O' },
              { name: 'Daryaganj', pincode: '110002', officeName: 'Darya Ganj S.O' },
              { name: 'Delhi GPO / Kashmiri Gate', pincode: '110006', officeName: 'Delhi G.P.O.' },
            ],
          },
          {
            name: 'Karol Bagh',
            villages: [
              { name: 'Karol Bagh Market', pincode: '110005', officeName: 'Karol Bagh S.O' },
              { name: 'Pusa Road / Rajendra Nagar', pincode: '110060', officeName: 'Rajinder Nagar S.O' },
              { name: 'Patel Nagar West', pincode: '110008', officeName: 'Patel Nagar S.O' },
            ],
          },
        ],
      },
      {
        name: 'New Delhi',
        subDistricts: [
          {
            name: 'Chanakyapuri',
            villages: [
              { name: 'Chanakyapuri Diplomatic Enclave', pincode: '110021', officeName: 'Chanakyapuri S.O' },
              { name: 'Connaught Place', pincode: '110001', officeName: 'Connaught Place S.O' },
              { name: 'Parliament Street', pincode: '110001', officeName: 'Parliament Street H.O' },
              { name: 'Rashtrapati Bhavan', pincode: '110004', officeName: 'Rashtrapati Bhawan S.O' },
              { name: 'Vasant Vihar', pincode: '110057', officeName: 'Vasant Vihar-1 S.O' },
            ],
          },
        ],
      },
      {
        name: 'South Delhi',
        subDistricts: [
          {
            name: 'Hauz Khas',
            villages: [
              { name: 'Hauz Khas Market', pincode: '110016', officeName: 'Hauz Khas S.O' },
              { name: 'Green Park', pincode: '110016', officeName: 'Green Park S.O' },
              { name: 'Saket District Centre', pincode: '110017', officeName: 'Malviya Nagar S.O' },
              { name: 'Greater Kailash 1', pincode: '110048', officeName: 'Greater Kailash S.O' },
              { name: 'Lajpat Nagar', pincode: '110024', officeName: 'Lajpat Nagar S.O' },
              { name: 'Mehrauli Village', pincode: '110030', officeName: 'Mehrauli S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    districts: [
      {
        name: 'Bengaluru Urban',
        subDistricts: [
          {
            name: 'Bengaluru North',
            villages: [
              { name: 'Bengaluru GPO / Vidhana Soudha', pincode: '560001', officeName: 'Bangalore G.P.O.' },
              { name: 'Malleswaram', pincode: '560003', officeName: 'Malleswaram S.O' },
              { name: 'Hebbal', pincode: '560024', officeName: 'Hebbal S.O' },
              { name: 'Yelahanka Satellite Town', pincode: '560064', officeName: 'Yelahanka S.O' },
              { name: 'Yeshwanthpur', pincode: '560022', officeName: 'Yeshwanthpur S.O' },
            ],
          },
          {
            name: 'Bengaluru South',
            villages: [
              { name: 'Jayanagar 4th Block', pincode: '560011', officeName: 'Jayanagar S.O' },
              { name: 'JP Nagar', pincode: '560078', officeName: 'J P Nagar S.O' },
              { name: 'Koramangala', pincode: '560034', officeName: 'Koramangala S.O' },
              { name: 'BTM Layout', pincode: '560068', officeName: 'BTM 2nd Stage S.O' },
              { name: 'Banashankari', pincode: '560050', officeName: 'Banashankari S.O' },
            ],
          },
          {
            name: 'Bengaluru East (Tech Corridors)',
            villages: [
              { name: 'Indiranagar', pincode: '560038', officeName: 'Indiranagar S.O' },
              { name: 'Whitefield', pincode: '560066', officeName: 'Whitefield S.O' },
              { name: 'Marathahalli', pincode: '560037', officeName: 'Marathahalli S.O' },
              { name: 'Bellandur (ORR)', pincode: '560103', officeName: 'Bellandur S.O' },
              { name: 'Electronic City', pincode: '560100', officeName: 'Electronic City S.O' },
            ],
          },
        ],
      },
      {
        name: 'Mysuru',
        subDistricts: [
          {
            name: 'Mysuru City',
            villages: [
              { name: 'Mysuru Palace / City H.O', pincode: '570001', officeName: 'Mysore H.O' },
              { name: 'Saraswathipuram', pincode: '570009', officeName: 'Saraswathipuram S.O' },
              { name: 'Gokulam', pincode: '570002', officeName: 'Vani Vilas Mohalla S.O' },
            ],
          },
          {
            name: 'Nanjangud',
            villages: [
              { name: 'Nanjangud Town', pincode: '571301', officeName: 'Nanjangud S.O' },
              { name: 'Hullahalli', pincode: '571314', officeName: 'Hullahalli S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    districts: [
      {
        name: 'Chennai',
        subDistricts: [
          {
            name: 'Chennai Central',
            villages: [
              { name: 'Chennai GPO (Parrys)', pincode: '600001', officeName: 'Chennai G.P.O.' },
              { name: 'Egmore', pincode: '600008', officeName: 'Egmore S.O' },
              { name: 'Triplicane', pincode: '600005', officeName: 'Triplicane S.O' },
              { name: 'Nungambakkam', pincode: '600034', officeName: 'Nungambakkam S.O' },
            ],
          },
          {
            name: 'Chennai South',
            villages: [
              { name: 'T Nagar', pincode: '600017', officeName: 'Thyagarayanagar H.O' },
              { name: 'Mylapore', pincode: '600004', officeName: 'Mylapore S.O' },
              { name: 'Adyar', pincode: '600020', officeName: 'Adyar S.O' },
              { name: 'Velachery', pincode: '600042', officeName: 'Velachery S.O' },
              { name: 'Guindy Industrial Estate', pincode: '600032', officeName: 'Guindy S.O' },
              { name: 'Thiruvanmiyur (OMR)', pincode: '600041', officeName: 'Thiruvanmiyur S.O' },
            ],
          },
        ],
      },
      {
        name: 'Coimbatore',
        subDistricts: [
          {
            name: 'Coimbatore South',
            villages: [
              { name: 'Coimbatore Head Office', pincode: '641001', officeName: 'Coimbatore H.O' },
              { name: 'RS Puram', pincode: '641002', officeName: 'R.S.Puram S.O' },
              { name: 'Gandhipuram', pincode: '641012', officeName: 'Gandhipuram S.O' },
              { name: 'Peelamedu', pincode: '641004', officeName: 'Peelamedu S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    districts: [
      {
        name: 'Lucknow',
        subDistricts: [
          {
            name: 'Lucknow Sadar',
            villages: [
              { name: 'Hazratganj / GPO', pincode: '226001', officeName: 'Lucknow G.P.O.' },
              { name: 'Gomti Nagar', pincode: '226010', officeName: 'Gomti Nagar S.O' },
              { name: 'Alambagh', pincode: '226005', officeName: 'Alambagh S.O' },
              { name: 'Indira Nagar', pincode: '226016', officeName: 'Indira Nagar S.O' },
              { name: 'Mahanagar', pincode: '226006', officeName: 'Mahanagar S.O' },
            ],
          },
          {
            name: 'Mohanlalganj',
            villages: [
              { name: 'Mohanlalganj Town', pincode: '226301', officeName: 'Mohanlalganj S.O' },
              { name: 'Gosainganj', pincode: '226501', officeName: 'Gosainganj S.O' },
            ],
          },
        ],
      },
      {
        name: 'Gautam Buddha Nagar (Noida)',
        subDistricts: [
          {
            name: 'Dadri (Noida Urban)',
            villages: [
              { name: 'Sector 18 Market Noida', pincode: '201301', officeName: 'Noida H.O' },
              { name: 'Sector 62 Institutional Area', pincode: '201309', officeName: 'Sector 62 S.O' },
              { name: 'Sector 137 Expressway', pincode: '201305', officeName: 'Sector 137 S.O' },
              { name: 'Greater Noida City Centre', pincode: '201310', officeName: 'Alpha Greater Noida S.O' },
              { name: 'Knowledge Park Greater Noida', pincode: '201306', officeName: 'Surajpur S.O' },
            ],
          },
        ],
      },
      {
        name: 'Varanasi',
        subDistricts: [
          {
            name: 'Varanasi Sadar',
            villages: [
              { name: 'Varanasi Cantt / Station', pincode: '221002', officeName: 'Varanasi Cantt H.O' },
              { name: 'Banaras Hindu University (BHU)', pincode: '221005', officeName: 'BHU S.O' },
              { name: 'Dashashwamedh Ghat', pincode: '221001', officeName: 'Varanasi City S.O' },
              { name: 'Sarnath', pincode: '221007', officeName: 'Sarnath S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    districts: [
      {
        name: 'Ahmedabad',
        subDistricts: [
          {
            name: 'Ahmedabad City',
            villages: [
              { name: 'Ahmedabad GPO', pincode: '380001', officeName: 'Ahmedabad G.P.O.' },
              { name: 'Navrangpura', pincode: '380009', officeName: 'Navrangpura H.O' },
              { name: 'Maninagar', pincode: '380008', officeName: 'Maninagar S.O' },
              { name: 'Bodakdev / SG Highway', pincode: '380054', officeName: 'Bodakdev S.O' },
              { name: 'Vastrapur (IIM-A)', pincode: '380015', officeName: 'Vastrapur S.O' },
              { name: 'Chandkheda / Sabarmati', pincode: '382424', officeName: 'Chandkheda S.O' },
            ],
          },
          {
            name: 'Sanand',
            villages: [
              { name: 'Sanand Industrial GIDC', pincode: '382110', officeName: 'Sanand S.O' },
              { name: 'Bavla', pincode: '382220', officeName: 'Bavla S.O' },
            ],
          },
        ],
      },
      {
        name: 'Surat',
        subDistricts: [
          {
            name: 'Surat City',
            villages: [
              { name: 'Surat Head Office', pincode: '395003', officeName: 'Surat H.O' },
              { name: 'Athwalines', pincode: '395001', officeName: 'Athwalines S.O' },
              { name: 'Varachha / Diamond Market', pincode: '395006', officeName: 'Varachha Road S.O' },
              { name: 'Adajan', pincode: '395009', officeName: 'Adajan Dn S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    districts: [
      {
        name: 'Kolkata',
        subDistricts: [
          {
            name: 'Kolkata Central & North',
            villages: [
              { name: 'Kolkata GPO (BBD Bagh)', pincode: '700001', officeName: 'Kolkata G.P.O.' },
              { name: 'Park Street', pincode: '700016', officeName: 'Park Street S.O' },
              { name: 'College Street', pincode: '700073', officeName: 'Bowbazar S.O' },
              { name: 'Shyambazar', pincode: '700004', officeName: 'Shyambazar S.O' },
            ],
          },
          {
            name: 'Kolkata South & East',
            villages: [
              { name: 'Salt Lake City Sector 1', pincode: '700064', officeName: 'Bidhannagar S.O' },
              { name: 'Salt Lake Sector 5 (IT Hub)', pincode: '700091', officeName: 'Sech Bhawan S.O' },
              { name: 'Ballygunge', pincode: '700019', officeName: 'Ballygunge S.O' },
              { name: 'Alipore', pincode: '700027', officeName: 'Alipore H.O' },
              { name: 'Jadavpur (University)', pincode: '700032', officeName: 'Jadavpur University S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    districts: [
      {
        name: 'Jaipur',
        subDistricts: [
          {
            name: 'Jaipur Urban',
            villages: [
              { name: 'Jaipur GPO (M.I. Road)', pincode: '302001', officeName: 'Jaipur G.P.O.' },
              { name: 'Malviya Nagar', pincode: '302017', officeName: 'Malviya Nagar S.O' },
              { name: 'Mansarovar', pincode: '302020', officeName: 'Mansarovar S.O' },
              { name: 'Vaishali Nagar', pincode: '302021', officeName: 'Vaishali Nagar S.O' },
              { name: 'Amer Fort Town', pincode: '302028', officeName: 'Amer S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Telangana',
    code: 'TG',
    districts: [
      {
        name: 'Hyderabad',
        subDistricts: [
          {
            name: 'Hyderabad Core',
            villages: [
              { name: 'Hyderabad GPO (Abids)', pincode: '500001', officeName: 'Hyderabad G.P.O.' },
              { name: 'Banjara Hills', pincode: '500034', officeName: 'Banjara Hills S.O' },
              { name: 'Jubilee Hills', pincode: '500033', officeName: 'Jubilee Hills S.O' },
              { name: 'Hitec City (Madhapur)', pincode: '500081', officeName: 'Madhapur S.O' },
              { name: 'Gachibowli Financial District', pincode: '500032', officeName: 'Gachibowli S.O' },
              { name: 'Secunderabad City', pincode: '500003', officeName: 'Secunderabad H.O' },
              { name: 'Begumpet', pincode: '500016', officeName: 'Begumpet S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    districts: [
      {
        name: 'Khordha (Bhubaneswar)',
        subDistricts: [
          {
            name: 'Bhubaneswar Urban',
            villages: [
              { name: 'Bhubaneswar GPO', pincode: '751001', officeName: 'Bhubaneswar G.P.O.' },
              { name: 'Saheed Nagar', pincode: '751007', officeName: 'Saheed Nagar S.O' },
              { name: 'Nayapalli / IRC Village', pincode: '751012', officeName: 'Nayapalli S.O' },
              { name: 'Chandrasekharpur', pincode: '751016', officeName: 'C.S.Pur S.O' },
              { name: 'Patia / KIIT Campus', pincode: '751024', officeName: 'KIIT S.O' },
              { name: 'Khandagiri', pincode: '751030', officeName: 'Khandagiri S.O' },
            ],
          },
          {
            name: 'Jatni',
            villages: [
              { name: 'Jatni Town / Railway Station', pincode: '752050', officeName: 'Jatni S.O' },
              { name: 'IIT Bhubaneswar Argul', pincode: '752050', officeName: 'Argul B.O' },
            ],
          },
        ],
      },
      {
        name: 'Puri',
        subDistricts: [
          {
            name: 'Puri Sadar',
            villages: [
              { name: 'Puri Jagannath Temple / Grand Road', pincode: '752001', officeName: 'Puri H.O' },
              { name: 'Sea Beach Puri', pincode: '752002', officeName: 'Sea Beach S.O' },
              { name: 'Konark Sun Temple Area', pincode: '752111', officeName: 'Konark S.O' },
              { name: 'Pipili Applique Village', pincode: '752104', officeName: 'Pipili S.O' },
            ],
          },
        ],
      },
      {
        name: 'Cuttack',
        subDistricts: [
          {
            name: 'Cuttack Sadar',
            villages: [
              { name: 'Cuttack GPO (Buxi Bazar)', pincode: '753001', officeName: 'Cuttack G.P.O.' },
              { name: 'College Square / Ravenshaw', pincode: '753003', officeName: 'College Square S.O' },
              { name: 'CDA Residential Sector', pincode: '753014', officeName: 'CDA S.O' },
              { name: 'Choudwar Industrial Town', pincode: '754025', officeName: 'Choudwar S.O' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    districts: [
      {
        name: 'Ernakulam (Kochi)',
        subDistricts: [
          {
            name: 'Kanayannur',
            villages: [
              { name: 'Ernakulam Head Office', pincode: '682011', officeName: 'Ernakulam H.O' },
              { name: 'Fort Kochi Heritage', pincode: '682001', officeName: 'Fort Kochi S.O' },
              { name: 'Kakkanad (InfoPark Kochi)', pincode: '682030', officeName: 'Kakkanad S.O' },
              { name: 'Edappally / Lulu Mall Area', pincode: '682024', officeName: 'Edappally S.O' },
            ],
          },
        ],
      },
      {
        name: 'Thiruvananthapuram',
        subDistricts: [
          {
            name: 'Thiruvananthapuram Sadar',
            villages: [
              { name: 'GPO Thiruvananthapuram (Secretariat)', pincode: '695001', officeName: 'Trivandrum G.P.O.' },
              { name: 'Technopark Campus (Kazhakoottam)', pincode: '695581', officeName: 'Technopark S.O' },
              { name: 'Pattom', pincode: '695004', officeName: 'Pattom S.O' },
              { name: 'Kovalam Beach', pincode: '695527', officeName: 'Kovalam S.O' },
            ],
          },
        ],
      },
    ],
  },
];
