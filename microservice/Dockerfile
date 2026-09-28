FROM python:3.13-slim as base

########################
# Install Dependencies #
########################

# Copy requirements.txt to container
COPY requirements.txt /tmp/requirements.txt

# Upgrade pip and install Python requirements
RUN pip3 install --upgrade pip ; \
    pip3 install --no-cache -r /tmp/requirements.txt

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*


###########
# Workdir #
###########

# Set workdir to app
WORKDIR /usr/src/app
ENV PYTHONPATH "${PYTHONPATH}:/usr/src/app"


##############################
# Define Default Dev Command #
##############################

CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8081"]


FROM base AS production

#############
# Copy Data #
#############

# Copy app to container
COPY ./src /usr/src/app

# Copy CSV data file
COPY ./Heart_Disease_Prediction_cleaned.csv /usr/src/app/


##########
# Verify #
##########

# Check content of app folder
RUN ls -la /usr/src/app


#####################################
# Define Default Production Command #
#####################################

# Start FastAPI server with Uvicorn in production mode.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
