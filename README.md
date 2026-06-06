docker build -t guigotoso/banco-node-back:1.7 .
docker push guigotoso/banco-node-back:1.7

kubectl apply -f k8s/

kubectl get pods
kubectl get svc
kubectl get ingress
