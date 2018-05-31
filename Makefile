#
# A simple makefile to run all building tasks.
# 
#

all:

	scripts/build-tools.sh  		#  to build the `tools` Docker image
	scripts/yarn.sh  			#  to install backend dependencies
	scripts/generate-proxy-api-models.sh  	#  to generate the models defined in api_proxy.yaml and api_notifications.yaml
	scripts/generate-api-client.sh  	#  to generate the Autorest API Client
	scripts/build.sh  			#  to compile the Typescript files
	docker-compose up -d  			#  to start the containers
