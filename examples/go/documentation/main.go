package main

import (
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	NewDatasourcesStack(app, "datasources")
	RemoteStateDataSourceStack(app, "datasources-remote-state")
	NewAspectsStack(app, "aspects")
	NewPrefixAspectsStack(app, "aspects-validation")
	NewFunctionsStack(app, "functions")
	NewOperatorsAndFunctionsRawStack(app, "operators-functions-raw")

	app.Synth()

	// examples that include the App() & Synth() bits
	SynthAssets()
	SynthConstructs()
	SynthConstructsScope()
}
