## Helm Charts
---
### What is Helm?
Helm is a package manager for Kubernetes that allows developers and operators to more easily package, configure, and deploy applications and services onto Kubernetes clusters.

Helm can:
- Install software.
- Automatically install software dependencies.
- Upgrade software.
- Configure software deployments.
- Fetch software packages from repositories.

### Helm components
- A command line tool, `helm`, which provides the user interface to all Helm functionality.
- A server component, `tiller`, that runs on your Kubernetes cluster, listens for commands from helm, and handles the configuration and deployment of software releases on the cluster.
- The Helm packaging format, called `charts`.
- An [official curated charts repository](https://github.com/helm/charts) with prepackaged charts for popular open-source software projects.

## Helm Chart structure
Helm packages are called `charts`, and they consist of a few YAML configuration files and some templates that are rendered into Kubernetes manifest files. Here is the basic directory structure of a chart:
```
chart-name/
  charts/
  templates/
  Chart.yaml
  LICENSE
  README.md
  requirements.yaml
  values.yaml
```
These directories and files have the following functions:
- **charts/**: Manually managed chart dependencies can be placed in this directory, though it is typically better to use `requirements.yaml` to dynamically link dependencies.
- **templates/**: This directory contains template files that are combined with configuration values (from `values.yaml` and the `command line`) and rendered into Kubernetes manifests. The templates use the ***Go*** programming language’s template format.
- **Chart.yaml**: A YAML file with metadata about the chart, such as `chart name` and `version`, maintainer information, a relevant website, and search keywords.
- **LICENSE**: A plaintext license for the chart.
- **README.md**: A readme file with information for users of the chart.
- **requirements.yaml**: A YAML file that lists the chart’s dependencies.
- **values.yaml**: A YAML file of default configuration values for the chart.

The `helm` command can install a chart from a local directory, or from a `.tar.gz` packaged version of this directory structure. These packaged charts can also be automatically downloaded and installed from chart repositories or repos.

### Chart configuration 
A chart usually comes with default configuration values in its `values.yaml` file. Some applications may be fully deployable with default values, but you’ll typically need to override some of the configuration to meet your needs.

You can use `helm inspect values chart-name` to dump all of the available configuration values for a chart. These values can be overridden by writing your own YAML file and using it when running `helm install`, or by setting options individually on the command line with the `--set` flag. You only need to specify those values that you want to change from the defaults.

## What is Helm Release?
During the installation of a chart, Helm combines the chart’s templates with the configuration specified by the user and the defaults in `values.yaml`. These are rendered into Kubernetes manifests that are then deployed via the Kubernetes API. This creates a release, a specific configuration and deployment of a particular chart. This concept of releases is important, because you may want to deploy the same application more than once on a cluster. 

You might upgrade a release because its chart has been updated, or because you want to update the release’s configuration. Either way, each upgrade will create a new `revision` of a release, and Helm will allow you to easily roll back to previous revisions in case there’s an issue.

## Working with Helm templates
A helm chart template is a YAML file similar to your kubernetes manifest file. A helm template file can contains expressions that can be substituted with the values declared in the `values.yaml` file. It can also contains the values from the `Release` metadata or `Chart.yaml` file. You can also create helper methods in a `_helpers.tpl` file and `include` them in the templates.

A sample *deployment.yaml* file looks like:

```
apiVersion: extensions/v1beta1
kind: Deployment
metadata: 
  name: {{ include "greetingsapp-chart.fullname" . }}
  labels:
    chart: "{{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}"
    managed-by: {{ .Release.ServiceName}}
    instance: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{include "greetingsapp-chart.name" .}}
      instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{include "greetingsapp-chart.name" .}}
        instance: {{ .Release.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag}}"
        imagePullPolicy: {{ .Values.image.imagePullPolicy }}
        ports:
        - containerPort: {{ .Values.service.internalPort }}  
          protocol : TCP 
```

A `service.yaml` file looks like:
```
apiVersion: v1
kind: Service
metadata:
  name: {{include "greetingsapp-chart.fullname" .}}
  labels:
    chart: "{{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}"
    instance: {{ .Release.Name }}
    managed-by: {{ .Release.ServiceName }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.internalPort }}
    protocol: TCP
    name: {{ .Values.service.name }}
  selector:
    app: {{include "greetingsapp-chart.name" .}}
    instance: {{ .Release.Name }}
```

Your `values.yaml` file contains the default values:
```
replicaCount: 1

image:
  repository: sonusathyadas/sampleapp
  tag: latest
  pullPolicy: IfNotPresent

service:
  name: greetingsapp-svc
  type: LoadBalancer
  port: 8080
  internalPort: 5000
```

## Deploy applications using Helm charts
You can create helm chart for your own containerized applications. Deploy the pods, services, persistent volume claims and secrets using a single command. Here, I am going to explain some helm commands that can be used to create and deploy applications using helm charts.

### helm create 
The `helm create ` command is used to create a helm chart project folder. The helm chart project contains the `templates` directory, `charts` directory, `Chart.yaml` file, `values.yaml` file, `.helmignore` file. You can also see a `_helpers.tpl` file inside the   `templates` directory that contains the helper methods for the template files. 
```
helm create greetingsapp-chart
```
You can update the template YAML files `values.yaml` file based on your application requirement. Also, add more YAML template files that can be used to deploy `pvc`, `secret`, `ingress` and more.

### helm lint &lt;chart-project-dir&gt;
The `helm lint` command can be used to validate your template YAML fiels. This will check whether your templates are well-formed or not.
```
PS C:\Kubernetes\Helm-charts> helm lint .\greetingsapp-chart\
==> Linting .\greetingsapp-chart\
[INFO] Chart.yaml: icon is recommended
1 chart(s) linted, no failures    
```
### helm template &lt;chart-project-dir&gt;
The `helm template` command renders your template files locally and outputs on the screen. You can verify the output yaml file is correct or not.
```
PS C:\Kubernetes\Helm-charts> helm template .\greetingsapp-chart\
---
# Source: greetingsapp-chart/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: release-name-greetingsapp-chart
  labels:
    chart: "greetingsapp-chart-0.1.0"
    instance: release-name
    managed-by:
spec:
  type: LoadBalancer
  ports:
  - port: 8080
    targetPort: 5000
    protocol: TCP
    name: greetingsapp-svc
  selector:
    app: greetingsapp-chart
    instance: release-name
---
# Source: greetingsapp-chart/templates/deployment.yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: release-name-greetingsapp-chart
  labels:
    chart: "greetingsapp-chart-0.1.0"
    managed-by:
    instance: release-name
spec:
  replicas: 1
  selector:
    matchLabels:
      app: greetingsapp-chart
      instance: release-name
  template:
    metadata:
      labels:
        app: greetingsapp-chart
        instance: release-name
    spec:
      containers:
      - name: greetingsapp-chart
        image: "sonusathyadas/sampleapp:latest"
        imagePullPolicy:
        ports:
        - containerPort: 5000
          protocol : TCP
```
### helm install 
Use the `helm install` command to deploy your containerized applications using helm charts. You can optionally use a release name along with the command. It will help you to delete or modify the helm deployments using the release name.

```
PS C:\Kubernetes\Helm-charts> helm install --name demoapp ./greetingsapp-chart
NAME:   demoapp
LAST DEPLOYED: Thu Oct  3 11:39:27 2019
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Pod(related)
NAME                                         READY  STATUS             RESTARTS  AGE
demoapp-greetingsapp-chart-74fcd7575c-7k87h  0/1    ContainerCreating  0         0s
demoapp-greetingsapp-chart-74fcd7575c-dtgvl  1/1    Terminating        0         22h

==> v1/Service
NAME                        TYPE          CLUSTER-IP     EXTERNAL-IP  PORT(S)         AGE
demoapp-greetingsapp-chart  LoadBalancer  10.99.193.204  <pending>    8080:32581/TCP  0s

==> v1beta1/Deployment
NAME                        READY  UP-TO-DATE  AVAILABLE  AGE
demoapp-greetingsapp-chart  0/1    1           0          0s
```

### helm ls
The `helm ls` command is used to list the helm released on your cluster. Use the `--all` option to view the deleted deployments also.

```
PS C:\Kubernetes\Helm-charts> helm ls --all
NAME    REVISION        UPDATED                         STATUS          CHART                           APP VERSION   NAMESPACE           demoapp 1               Thu Oct  3 11:39:27 2019        DEPLOYED        greetingsapp-chart-0.1.0        1.0           default
```

### helm delete 
The `helm delete` command is used to delete a helm deployment. You can optionally use `--purge` to delete the deployment permenantly.

```
PS C:\Kubernetes\Helm-charts> helm delete --purge demoapp
release "demoapp" deleted 
```

### helm package
The `helm package` command helps you to package your helm chart for distribution. This is the command to create versioned archive files of the chart. 
```
PS C:\Kubernetes\Helm-charts> cd .\greetingsapp-chart
PS C:\Kubernetes\Helm-charts\greetingsapp-chart> helm package .\
Successfully packaged chart and saved it to: C:\Kubernetes\Helm-charts\greetingsapp-chart\greetingsapp-chart-0.1.0.tgz    
```
This creates a versioned archive file that can be distributed manually or using a public or private repositories.

### helm repo
Now, you have packaged your helm chart that is ready for distribution. You can distribute it using a shared repository. You can push your helm charts into a `github` repository and share it. Remember, you need to create and `index.yaml` file inside the repo directory. Create a github repository for your helm chart and run the following command.
```
PS C:\Kubernetes\Helm-charts\greetingsapp-chart> helm repo index ./ --url https://github.com/sonusathyadas/greetingsapp-chart-repo
```
This generates the index.yaml file, which we should push to the repository along with the chart archives.

Now, you can start creating your own helm charts for your own applications. 