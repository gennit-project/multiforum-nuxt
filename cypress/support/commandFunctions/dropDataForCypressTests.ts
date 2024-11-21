
const dropDataForCypressTests = () => {
    cy.authenticatedGraphQL(`
    mutation dropDataForCypressTests {
        dropDataForCypressTests {
            success
            message
        }
    }
    `).then((response) => {
        const data = response?.body?.data?.dropDataForCypressTests;
        if (!data) {
            throw new Error(`🚨 dropDataForCypressTests failed: ${JSON.stringify(response)}`);
        }
    });
}

export default dropDataForCypressTests;