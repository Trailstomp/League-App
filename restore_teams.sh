#!/bin/bash

# Script to restore the remaining teams to the database

echo "Adding American Dads..."
curl -X POST "https://league-manager-27.preview.emergentagent.com/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "2",
    "name": "American Dads",
    "division": "Field",
    "wins": 6,
    "losses": 4,
    "ties": 1,
    "coach": "Coach Johnson",
    "homeField": "Johnson Park",
    "contactEmail": "coach@americandads.com",
    "active": true,
    "style": {
      "primaryColor": "#2563eb",
      "backgroundColor": "#eff6ff",
      "accentColor": "#1d4ed8",
      "logoUrl": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMyNTYzZWIiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0yMSA5SDNsMy4wNSA1LjE5IDEuNDctMS44OCAzLjA1IDUuMTlMMTIgMTNsMS40OCAzLjUgMy4wNS01LjE5IDEuNDcgMS44OEwyMSA5eiIvPgo8L3N2Zz4KPC9zdmc+Cg==",
      "logoOpacity": 1,
      "bannerUrl": ""
    }
  }'

echo -e "\n\nAdding Cincinnati Trash Pandas..."
curl -X POST "https://league-manager-27.preview.emergentagent.com/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "3",
    "name": "Cincinnati Trash Pandas",
    "division": "Box",
    "wins": 7,
    "losses": 3,
    "ties": 0,
    "coach": "Coach Williams",
    "homeField": "Cincinnati Arena",
    "contactEmail": "coach@trashpandas.com",
    "active": true,
    "style": {
      "primaryColor": "#059669",
      "backgroundColor": "#ecfdf5",
      "accentColor": "#047857",
      "logoUrl": "",
      "logoOpacity": 1,
      "bannerUrl": ""
    }
  }'

echo -e "\n\nAdding Columbus Ball Hawgs..."
curl -X POST "https://league-manager-27.preview.emergentagent.com/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "4",
    "name": "Columbus Ball Hawgs",
    "division": "Field",
    "wins": 5,
    "losses": 5,
    "ties": 0,
    "coach": "Coach Davis",
    "homeField": "Columbus Stadium",
    "contactEmail": "coach@ballhawgs.com",
    "active": true,
    "style": {
      "primaryColor": "#7c3aed",
      "backgroundColor": "#f3e8ff",
      "accentColor": "#6d28d9",
      "logoUrl": "",
      "logoOpacity": 1,
      "bannerUrl": ""
    }
  }'

echo -e "\n\nTeams restoration completed!"