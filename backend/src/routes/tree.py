from fastapi import APIRouter

from models.schemas import TreeNode

router = APIRouter(prefix="/tree", tags=["Tree"])

RAW_TREE_JSON = """{
 "node_id": 0,
 "impurity": 0.4897959183673469,
 "n_node_samples": 189,
 "value": [
  [
   0.5714285714285714,
   0.42857142857142855
  ]
 ],
 "feature": "Thallium",
 "threshold": 4.5,
 "children": [
  {
   "node_id": 1,
   "impurity": 0.28195087219651116,
   "n_node_samples": 106,
   "value": [
    [
     0.8301886792452831,
     0.16981132075471697
    ]
   ],
   "feature": "Number of vessels fluro",
   "threshold": 0.5,
   "children": [
    {
     "node_id": 2,
     "impurity": 0.14542936288088648,
     "n_node_samples": 76,
     "value": [
      [
       0.9210526315789473,
       0.07894736842105263
      ]
     ],
     "feature": "BP",
     "threshold": 157.0,
     "children": [
      {
       "node_id": 3,
       "impurity": 0.10358416213173205,
       "n_node_samples": 73,
       "value": [
        [
         0.9452054794520548,
         0.0547945205479452
        ]
       ],
       "feature": "Max HR",
       "threshold": 83.5,
       "children": [
        {
         "node_id": 4,
         "impurity": 0.0,
         "n_node_samples": 1,
         "value": [
          [
           0.0,
           1.0
          ]
         ],
         "class": "Disease"
        },
        {
         "node_id": 5,
         "impurity": 0.07986111111111116,
         "n_node_samples": 72,
         "value": [
          [
           0.9583333333333334,
           0.041666666666666664
          ]
         ],
         "feature": "ST depression",
         "threshold": 2.799999952316284,
         "children": [
          {
           "node_id": 6,
           "impurity": 0.05629069523209407,
           "n_node_samples": 69,
           "value": [
            [
             0.9710144927536232,
             0.028985507246376812
            ]
           ],
           "feature": "Max HR",
           "threshold": 154.5,
           "children": [
            {
             "node_id": 7,
             "impurity": 0.18000000000000005,
             "n_node_samples": 20,
             "value": [
              [
               0.9,
               0.1
              ]
             ],
             "feature": "Max HR",
             "threshold": 153.5,
             "children": [
              {
               "node_id": 8,
               "impurity": 0.09972299168975074,
               "n_node_samples": 19,
               "value": [
                [
                 0.9473684210526315,
                 0.05263157894736842
                ]
               ],
               "feature": "BP",
               "threshold": 109.0,
               "children": [
                {
                 "node_id": 9,
                 "impurity": 0.4444444444444444,
                 "n_node_samples": 3,
                 "value": [
                  [
                   0.6666666666666666,
                   0.3333333333333333
                  ]
                 ],
                 "feature": "Chest pain type",
                 "threshold": 3.5,
                 "children": [
                  {
                   "node_id": 10,
                   "impurity": 0.0,
                   "n_node_samples": 1,
                   "value": [
                    [
                     0.0,
                     1.0
                    ]
                   ],
                   "class": "Disease"
                  },
                  {
                   "node_id": 11,
                   "impurity": 0.0,
                   "n_node_samples": 2,
                   "value": [
                    [
                     1.0,
                     0.0
                    ]
                   ],
                   "class": "No Disease"
                  }
                 ]
                },
                {
                 "node_id": 12,
                 "impurity": 0.0,
                 "n_node_samples": 16,
                 "value": [
                  [
                   1.0,
                   0.0
                  ]
                 ],
                 "class": "No Disease"
                }
               ]
              },
              {
               "node_id": 13,
               "impurity": 0.0,
               "n_node_samples": 1,
               "value": [
                [
                 0.0,
                 1.0
                ]
               ],
               "class": "Disease"
              }
             ]
            },
            {
             "node_id": 14,
             "impurity": 0.0,
             "n_node_samples": 49,
             "value": [
              [
               1.0,
               0.0
              ]
             ],
             "class": "No Disease"
            }
           ]
          },
          {
           "node_id": 15,
           "impurity": 0.4444444444444444,
           "n_node_samples": 3,
           "value": [
            [
             0.6666666666666666,
             0.3333333333333333
            ]
           ],
           "feature": "Age",
           "threshold": 52.5,
           "children": [
            {
             "node_id": 16,
             "impurity": 0.0,
             "n_node_samples": 2,
             "value": [
              [
               1.0,
               0.0
              ]
             ],
             "class": "No Disease"
            },
            {
             "node_id": 17,
             "impurity": 0.0,
             "n_node_samples": 1,
             "value": [
              [
               0.0,
               1.0
              ]
             ],
             "class": "Disease"
            }
           ]
          }
         ]
        }
       ]
      },
      {
       "node_id": 18,
       "impurity": 0.4444444444444444,
       "n_node_samples": 3,
       "value": [
        [
         0.3333333333333333,
         0.6666666666666666
        ]
       ],
       "feature": "index",
       "threshold": 138.5,
       "children": [
        {
         "node_id": 19,
         "impurity": 0.0,
         "n_node_samples": 2,
         "value": [
          [
           0.0,
           1.0
          ]
         ],
         "class": "Disease"
        },
        {
         "node_id": 20,
         "impurity": 0.0,
         "n_node_samples": 1,
         "value": [
          [
           1.0,
           0.0
          ]
         ],
         "class": "No Disease"
        }
       ]
      }
     ]
    },
    {
     "node_id": 21,
     "impurity": 0.48,
     "n_node_samples": 30,
     "value": [
      [
       0.6,
       0.4
      ]
     ],
     "feature": "Chest pain type",
     "threshold": 3.5,
     "children": [
      {
       "node_id": 22,
       "impurity": 0.2076124567474048,
       "n_node_samples": 17,
       "value": [
        [
         0.8823529411764706,
         0.11764705882352941
        ]
       ],
       "feature": "index",
       "threshold": 49.0,
       "children": [
        {
         "node_id": 23,
         "impurity": 0.4444444444444444,
         "n_node_samples": 3,
         "value": [
          [
           0.3333333333333333,
           0.6666666666666666
          ]
         ],
         "feature": "Sex",
         "threshold": 0.5,
         "children": [
          {
           "node_id": 24,
           "impurity": 0.0,
           "n_node_samples": 1,
           "value": [
            [
             1.0,
             0.0
            ]
           ],
           "class": "No Disease"
          },
          {
           "node_id": 25,
           "impurity": 0.0,
           "n_node_samples": 2,
           "value": [
            [
             0.0,
             1.0
            ]
           ],
           "class": "Disease"
          }
         ]
        },
        {
         "node_id": 26,
         "impurity": 0.0,
         "n_node_samples": 14,
         "value": [
          [
           1.0,
           0.0
          ]
         ],
         "class": "No Disease"
        }
       ]
      },
      {
       "node_id": 27,
       "impurity": 0.3550295857988166,
       "n_node_samples": 13,
       "value": [
        [
         0.23076923076923078,
         0.7692307692307693
        ]
       ],
        "feature": "Cholesterol",
       "threshold": 298.5,
       "children": [
        {
         "node_id": 28,
         "impurity": 0.1652892561983471,
         "n_node_samples": 11,
         "value": [
          [
           0.09090909090909091,
           0.9090909090909091
          ]
         ],
         "feature": "BP",
         "threshold": 107.0,
         "children": [
          {
           "node_id": 29,
           "impurity": 0.0,
           "n_node_samples": 1,
           "value": [
            [
             1.0,
             0.0
            ]
           ],
           "class": "No Disease"
          },
          {
           "node_id": 30,
           "impurity": 0.0,
           "n_node_samples": 10,
           "value": [
            [
             0.0,
             1.0
            ]
           ],
           "class": "Disease"
          }
         ]
        },
        {
         "node_id": 31,
         "impurity": 0.0,
         "n_node_samples": 2,
         "value": [
          [
           1.0,
           0.0
          ]
         ],
         "class": "No Disease"
        }
       ]
      }
     ]
    }
   ]
  },
  {
   "node_id": 32,
   "impurity": 0.3658005516040064,
   "n_node_samples": 83,
   "value": [
    [
     0.24096385542168675,
     0.7590361445783133
    ]
   ],
   "feature": "ST depression",
   "threshold": 0.550000011920929,
   "children": [
    {
     "node_id": 33,
     "impurity": 0.4992,
     "n_node_samples": 25,
     "value": [
      [
       0.52,
       0.48
      ]
     ],
     "feature": "EKG results",
     "threshold": 1.0,
     "children": [
      {
       "node_id": 34,
       "impurity": 0.4444444444444444,
       "n_node_samples": 18,
       "value": [
        [
         0.6666666666666666,
         0.3333333333333333
        ]
       ],
       "feature": "Cholesterol",
       "threshold": 217.0,
       "children": [
        {
         "node_id": 35,
         "impurity": 0.0,
         "n_node_samples": 6,
         "value": [
          [
           1.0,
           0.0
          ]
         ],
         "class": "No Disease"
        },
        {
         "node_id": 36,
         "impurity": 0.5,
         "n_node_samples": 12,
         "value": [
          [
           0.5,
           0.5
          ]
         ],
         "feature": "Cholesterol",
         "threshold": 262.0,
         "children": [
          {
           "node_id": 37,
           "impurity": 0.4444444444444444,
           "n_node_samples": 9,
           "value": [
            [
             0.3333333333333333,
             0.6666666666666666
            ]
           ],
           "feature": "Cholesterol",
           "threshold": 240.0,
           "children": [
            {
             "node_id": 38,
             "impurity": 0.48,
             "n_node_samples": 5,
             "value": [
              [
               0.6,
               0.4
              ]
             ],
             "feature": "index",
             "threshold": 142.0,
             "children": [
              {
               "node_id": 39,
               "impurity": 0.4444444444444444,
               "n_node_samples": 3,
               "value": [
                [
                 0.3333333333333333,
                 0.6666666666666666
                ]
               ],
               "feature": "Slope of ST",
               "threshold": 1.5,
               "children": [
                {
                 "node_id": 40,
                 "impurity": 0.0,
                 "n_node_samples": 2,
                 "value": [
                  [
                   0.0,
                   1.0
                  ]
                 ],
                 "class": "Disease"
                },
                {
                 "node_id": 41,
                 "impurity": 0.0,
                 "n_node_samples": 1,
                 "value": [
                  [
                   1.0,
                   0.0
                  ]
                 ],
                 "class": "No Disease"
                }
               ]
              },
              {
               "node_id": 42,
               "impurity": 0.0,
               "n_node_samples": 2,
               "value": [
                [
                 1.0,
                 0.0
                ]
               ],
               "class": "No Disease"
              }
             ]
            },
            {
             "node_id": 43,
             "impurity": 0.0,
             "n_node_samples": 4,
             "value": [
              [
               0.0,
               1.0
              ]
             ],
             "class": "Disease"
            }
           ]
          },
          {
           "node_id": 44,
           "impurity": 0.0,
           "n_node_samples": 3,
           "value": [
            [
             1.0,
             0.0
            ]
           ],
           "class": "No Disease"
          }
         ]
        }
       ]
      },
      {
       "node_id": 45,
       "impurity": 0.24489795918367352,
       "n_node_samples": 7,
       "value": [
        [
         0.14285714285714285,
         0.8571428571428571
        ]
       ],
       "feature": "index",
       "threshold": 209.5,
       "children": [
        {
         "node_id": 46,
         "impurity": 0.0,
         "n_node_samples": 6,
         "value": [
          [
           0.0,
           1.0
          ]
         ],
         "class": "Disease"
        },
        {
         "node_id": 47,
         "impurity": 0.0,
         "n_node_samples": 1,
         "value": [
          [
           1.0,
           0.0
          ]
         ],
         "class": "No Disease"
        }
       ]
      }
     ]
    },
    {
     "node_id": 48,
     "impurity": 0.21224732461355533,
     "n_node_samples": 58,
     "value": [
      [
       0.1206896551724138,
       0.8793103448275862
      ]
     ],
     "feature": "Chest pain type",
     "threshold": 1.5,
     "children": [
      {
       "node_id": 49,
       "impurity": 0.375,
       "n_node_samples": 4,
       "value": [
        [
         0.75,
         0.25
        ]
       ],
       "feature": "Max HR",
       "threshold": 172.0,
       "children": [
        {
         "node_id": 50,
         "impurity": 0.0,
         "n_node_samples": 3,
         "value": [
          [
           1.0,
           0.0
          ]
         ],
         "class": "No Disease"
        },
        {
         "node_id": 51,
         "impurity": 0.0,
         "n_node_samples": 1,
         "value": [
          [
           0.0,
           1.0
          ]
         ],
         "class": "Disease"
        }
       ]
      },
      {
       "node_id": 52,
       "impurity": 0.13717421124828533,
       "n_node_samples": 54,
       "value": [
        [
         0.07407407407407407,
         0.9259259259259259
        ]
       ],
       "feature": "BP",
       "threshold": 119.0,
       "children": [
        {
         "node_id": 53,
         "impurity": 0.4897959183673469,
         "n_node_samples": 7,
         "value": [
          [
           0.42857142857142855,
           0.5714285714285714
          ]
         ],
         "feature": "Cholesterol",
         "threshold": 258.0,
         "children": [
          {
           "node_id": 54,
           "impurity": 0.31999999999999995,
           "n_node_samples": 5,
           "value": [
            [
             0.2,
             0.8
            ]
           ],
           "feature": "Cholesterol",
           "threshold": 215.0,
           "children": [
            {
             "node_id": 55,
             "impurity": 0.0,
             "n_node_samples": 1,
             "value": [
              [
               1.0,
               0.0
              ]
             ],
             "class": "No Disease"
            },
            {
             "node_id": 56,
             "impurity": 0.0,
             "n_node_samples": 4,
             "value": [
              [
               0.0,
               1.0
              ]
             ],
             "class": "Disease"
            }
           ]
          },
          {
           "node_id": 57,
           "impurity": 0.0,
           "n_node_samples": 2,
           "value": [
            [
             1.0,
             0.0
            ]
           ],
           "class": "No Disease"
          }
         ]
        },
        {
         "node_id": 58,
         "impurity": 0.041647804436396596,
         "n_node_samples": 47,
         "value": [
          [
           0.02127659574468085,
           0.9787234042553191
          ]
         ],
         "feature": "index",
         "threshold": 232.0,
         "children": [
          {
           "node_id": 59,
           "impurity": 0.0,
           "n_node_samples": 39,
           "value": [
            [
             0.0,
             1.0
            ]
           ],
           "class": "Disease"
          },
          {
           "node_id": 60,
           "impurity": 0.21875,
           "n_node_samples": 8,
           "value": [
            [
             0.125,
             0.875
            ]
           ],
           "feature": "index",
           "threshold": 234.5,
           "children": [
            {
             "node_id": 61,
             "impurity": 0.0,
             "n_node_samples": 1,
             "value": [
              [
               1.0,
               0.0
              ]
             ],
             "class": "No Disease"
            },
            {
             "node_id": 62,
             "impurity": 0.0,
             "n_node_samples": 7,
             "value": [
              [
               0.0,
               1.0
              ]
             ],
             "class": "Disease"
            }
           ]
          }
         ]
        }
       ]
      }
     ]
    }
   ]
  }
 ]
}"""

TREE_DATA = TreeNode.model_validate_json(RAW_TREE_JSON)


def get_tree_data() -> TreeNode:
    """Return the static decision tree used by the frontend."""
    return TREE_DATA.model_copy(deep=True)


@router.get("/", response_model=TreeNode)
async def read_tree() -> TreeNode:
    """Expose the decision tree JSON to clients."""
    return get_tree_data()
