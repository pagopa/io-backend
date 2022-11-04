Procedura per importare le specifiche di PN:

1. scaricare swagger-codegen
    wget https://repo1.maven.org/maven2/io/swagger/codegen/v3/swagger-codegen-cli/3.0.35/swagger-codegen-cli-3.0.35.jar
2. eseguire la generazione del file mergiato, sostituendo come parametro di -i la versione del file desiderato di PN
    java -jar swagger-codegen-cli-3.0.35.jar generate -l openapi-yaml -i https://raw.githubusercontent.com/pagopa/pn-delivery/9ed6342c02bfe1f03dc75a2e37415fdbebcce437/docs/openapi/appio/api-external-b2b-appio-v1.yaml -o . -DoutputFile=output.yaml
3. sovrascrivere il file openapi/api-piattaforma-notifiche.yaml con il contenuto file output.yaml generato dal comando precedente
4. fixare l'api
    /delivery-push/{iun}/legal-facts/{legalFactType}/{legalFactId}:
    sostituendo la $ref del parametro legalFactType con la sua definizione completa
    Questo è necessario poichè il codegen attualmente non supporta il $ref nei parametri delle API
5. fixare la definizione di ProblemError aggiungendo "type: object" mancante
6. rimuovere lo / iniziale da tutti i paths