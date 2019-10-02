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
