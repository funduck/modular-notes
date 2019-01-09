data=`cat POST_node.txt | sed 's/$/\r/'`
curl -X POST -H "Content-Type: multipart/form-data; boundary=aBoundaryString" -d $"$data" localhost:8000/

#curl -X POST -H "Content-Type: multipart/form-data; boundary=----------------------------4ebf00fbcf09" -d $'------------------------------4ebf00fbcf09\r\nContent-Disposition: form-data; name="example"\r\n\r\ntest\r\n------------------------------4ebf00fbcf09--\r\n' http://localhost:8000
