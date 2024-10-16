import ctypes  

def fun():
    print ("Do something")


f = r"E:\软件\PrScrn.dll"
def capture():  
    try:  
        dll = ctypes.cdll.LoadLibrary(f)  
    except Exception as e:   
        print("Dll load error!", e)  
        return  
    else:  
        try:  
            dll.PrScrn(0)  
        except Exception:  
            print("Sth wrong in capture!")  
            return  
  
def main():  
    capture()  
    
main()